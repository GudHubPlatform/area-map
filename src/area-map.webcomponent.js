import GhHtmlElement from "@gudhub/gh-html-element";

import L from 'leaflet';

import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

import html from "./area-map.html";
import './style.scss';

class AreaMap extends GhHtmlElement {
    constructor() {
        super();

        this.map = null;
    }

    onInit() {
        super.render(html);

        this.appId = this.scope.field_model.data_model.app_id;
        this.nameFieldId = this.scope.field_model.data_model.name_field_id;
        this.neFieldId = this.scope.field_model.data_model.ne_field_id;
        this.swFieldId = this.scope.field_model.data_model.sw_field_id;
        this.viewFieldId = this.scope.field_model.data_model.hover_view_id;
        this.clickFieldId = this.scope.field_model.data_model.click_view_id;

        this.renderComponent();
    }

    renderComponent() {
        const map = L.map('map').setView([53.678, -2.243], 6);
        this.map = map;

        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
        L.control.scale({
            position: 'bottomleft',
            metric: true,
            imperial: false,
            maxWidth: Math.floor(window.innerWidth * 0.6)
        }).addTo(map);

        const drawControl = new L.Control.Draw({
            edit: {
                featureGroup: drawnItems,
                remove: true
            },
            draw: {
                polygon: false,
                polyline: {
                    shapeOptions: {
                        color: '#ff6b35',
                        weight: 3
                    },
                    showLength: true,
                    metric: true
                },
                rectangle: { showArea: false },
                circle: false,
                marker: false,
                circlemarker: false,

            }
        });
        map.addControl(drawControl);

        const loadAndDrawRectangles = async () => {
            try {
                const data = await gudhub.jsonConstructor(
                    {
                        "type": "array",
                        "id": 1,
                        "childs": [
                            { "type": "property", "id": 3, "property_type": "function", "field_id": "862815", "function": "function(item, appId, gudhub) {\n  return item.item_id;\n}", "property_name": "item_id" },
                            { "type": "property", "id": 3, "property_name": "area_name", "property_type": "field_value", "field_id": this.nameFieldId },
                            { "type": "property", "id": 4, "property_name": "north_east", "property_type": "field_value", "field_id": this.neFieldId },
                            { "type": "property", "id": 5, "property_name": "south_west", "property_type": "field_value", "field_id": this.swFieldId }
                        ],
                        "property_name": "rectangles",
                        "app_id": this.appId,
                        "filter": []
                    }
                );

                data.rectangles.forEach(rectData => this.attachRectangleToMap(map, rectData));
            } catch (error) {
                console.error('Помилка завантаження даних:', error);
            }
        }

        loadAndDrawRectangles();

        const createPopup = (layer, ne, sw, cityName) => {
            const container = document.createElement('div');

            container.innerHTML = `
                <b>City:</b> ${cityName}<br>
                <b>North-East:</b> ${ne.lat}, ${ne.lng}<br>
                <b>South-West:</b> ${sw.lat}, ${sw.lng}<br>
            `;

            const button = document.createElement('button');
            button.textContent = 'Save Rectangle';

            button.addEventListener('click', async () => {
                await this.saveRectangle(ne.lat, ne.lng, sw.lat, sw.lng, cityName);

                layer.closePopup();
                layer.unbindPopup();
                layer.setStyle({
                    fillOpacity: 0
                });
            });

            container.appendChild(button);

            return container;
        };

        async function getCityName(lat, lng) {
            let cityName = "Невідоме місце";

            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.address) {
                    cityName = data.address.city ||
                        data.address.town ||
                        data.address.village ||
                        data.address.municipality ||
                        data.address.county ||
                        data.address.state ||
                        "Невідоме місце";
                }
            } catch (err) {
                console.error('Помилка пошуку міста:', err);
            }

            return cityName;
        }

        map.on(L.Draw.Event.CREATED, async function (e) {
            const layer = e.layer;
            drawnItems.addLayer(layer);

            if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                const latLngs = layer.getLatLngs();
                let totalDistance = 0;

                for (let i = 0; i < latLngs.length - 1; i++) {
                    totalDistance += latLngs[i].distanceTo(latLngs[i + 1]);
                }

                let distanceText;
                if (totalDistance < 1000) {
                    distanceText = Math.round(totalDistance) + ' м';
                } else {
                    distanceText = (totalDistance / 1000).toFixed(2) + ' км';
                }

                const contentString = `<b>Виміряна відстань</b><br>
                    Загальна довжина: <b>${distanceText}</b><br>
                    Кількість точок: ${latLngs.length}
                `;

                layer.bindPopup(contentString);
            } else {
                const bounds = layer.getBounds();
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();

                let cityName = await getCityName(ne.lat, sw.lng);
                const contentString = createPopup(rectangle, ne, sw, cityName);

                layer.bindPopup(contentString);
            }
        });

        map.on(L.Draw.Event.EDITED, function (e) {
            const layers = e.layers;
            layers.eachLayer(async function (layer) {
                const bounds = layer.getBounds();
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();

                let cityName = await getCityName(ne.lat, sw.lng);
                const contentString = createPopup(rectangle, ne, sw, cityName);
                layer.bindPopup(contentString);
            });
        });

        map.on(L.Draw.Event.DELETED, function (e) {
            console.log('Rectangle(s) deleted');
        });

        map.on('click', async function (e) {
            if (drawControl._toolbars.draw._activeMode) {
                return;
            }

            const rectangle = L.rectangle([
                [e.latlng.lat - 0.025, e.latlng.lng - 0.025],
                [e.latlng.lat + 0.025, e.latlng.lng + 0.025]
            ], {
                color: "#000",
                weight: 2,
                fillColor: "#000",
                fillOpacity: 0.35
            });

            drawnItems.addLayer(rectangle);

            const bounds = rectangle.getBounds();
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();

            let cityName = await getCityName(e.latlng.lat, e.latlng.lng);

            const popupContent = createPopup(rectangle, ne, sw, cityName);
            rectangle.bindPopup(popupContent).openPopup();
        });
    }

    createRectangleFromAPI(data) {
        const [neLatStr, neLngStr] = data.north_east.split(', ');
        const [swLatStr, swLngStr] = data.south_west.split(', ');

        const neLat = parseFloat(neLatStr);
        const neLng = parseFloat(neLngStr);
        const swLat = parseFloat(swLatStr);
        const swLng = parseFloat(swLngStr);

        return L.rectangle([
            [swLat, swLng],
            [neLat, neLng]
        ], {
            color: "#FF0000",
            weight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35
        });
    }

    attachRectangleToMap = (map, rectData) => {
        const rectangle = this.createRectangleFromAPI(rectData);
        rectangle.addTo(map);

        rectangle.addEventListener('mouseover', () => {
            const container = document.createElement('div');
            container.classList.add('view-container');
            const template = angular.element(`<gh-view app-id="${this.appId}" item-id="${rectData.item_id}" view-id="${this.viewFieldId}"></gh-view>`);
            this.renderAngularElement(container, template);
            rectangle.bindPopup(container, { minWidth: 350 }).openPopup();
        });

        rectangle.addEventListener('mouseout', () => {
            rectangle.closePopup();
        });

        rectangle.addEventListener('click', () => {
            const injector = angular.element(document.querySelector('body')).injector();
            const $location = injector.get('$location');
            const $rootScope = injector.get('$rootScope');
            const $scope = $rootScope.$new(true);

            $location.path(
                'act/open_item/' + this.appId + '/' + this.clickFieldId + '/' + rectData.item_id
            );
            $scope.$apply();
        });
    }

    async saveRectangle(neLat, neLng, swLat, swLng, cityName = 'Unknown') {
        const itemsList = [{
            "item_id": 0,
            "fields": [
                {
                    "field_id": this.neFieldId,
                    "field_value": `${neLat}, ${neLng}`,
                },
                {
                    "field_id": this.swFieldId,
                    "field_value": `${swLat}, ${swLng}`
                },
                {
                    "field_id": this.nameFieldId,
                    "field_value": cityName,
                },
            ]
        }];

        const res = await gudhub.addNewItems(this.appId, itemsList);

        const newRectangleData = {
            area_name: cityName,
            item_id: res[0]?.item_id,
            north_east: `${neLat}, ${neLng}`,
            south_west: `${swLat}, ${swLng}`
        };

        this.attachRectangleToMap(this.map, newRectangleData);
    }

    onUpdate() {
        super.render(html);
    }
}

if (!customElements.get('area-map')) {
    customElements.define('area-map', AreaMap);
}
