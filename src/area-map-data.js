import './area-map.webcomponent.js';

export default class AreaMapData {

    /*------------------------------- FIELD TEMPLATE --------------------------------------*/

    getTemplate() {
        return {
            constructor: 'field',
            name: 'Area Map',
            icon: 'text_icon',
            model: {
                field_id: 0,
                field_name: 'Area Map',
                field_value: '',
                data_type: 'area_map',
                data_model: {
                    app_id: null,
                    name_field_id: null,
                    ne_field_id: null,
                    sw_field_id: null,
                    hover_view_id: null,
                    click_view_id: null,
                    interpretation: [{
                        src: 'form',
                        id: 'default',
                        settings: {
                            editable: 1,
                            show_field_name: 1,
                            show_field: 1
                        },
                        style: { position: "beetwen" }
                    }]
                }
            }
        };
    }

    /*------------------------------- INTERPRETATION --------------------------------------*/

    getInterpretation(gudhub, value, appId, itemId, field_model) {

        return [{
            id: 'default',
            name: 'Default',
            content: () =>
                '<area-map app-id="{{appId}}" item-id="{{itemId}}" field-id="{{fieldId}}"></area-map>' 
        }, {
            id: 'value',
            name: 'Value',
            content: () => value
        }];
    }

    /*--------------------------  SETTINGS --------------------------------*/

    getSettings(scope) {
        return [{
            title: 'Options',
            type: 'general_setting',
            icon: 'menu',
            columns_list: [
                [
                    {
                        type: 'ghElement',
                        property: 'data_model.app_id',
                        data_model: function () {
                            return {
                                field_name: 'App Id',
                                name_space: 'app_id',
                                data_type: 'app',
                                data_model: {
                                    interpretation: [{
                                        src: 'form',
                                        id: 'with_text',
                                        settings: {
                                            editable: 1,
                                            show_field_name: 1,
                                            show_field: 1
                                        }
                                    }]
                                }
                            };
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.name_field_id',
                        onInit: function (settingScope, fieldModel) {

                            settingScope.$watch(function () {
                                return fieldModel.data_model.app_id;
                            }, function (newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });

                        },
                        data_model: function (fieldModel) {
                            return {
                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                },
                                field_name: 'Name',
                                name_space: 'field_id_name',
                                data_type: 'field'
                            };
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.ne_field_id',
                        onInit: function (settingScope, fieldModel) {

                            settingScope.$watch(function () {
                                return fieldModel.data_model.app_id;
                            }, function (newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });

                        },
                        data_model: function (fieldModel) {
                            return {
                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                },
                                field_name: 'North-East coords',
                                name_space: 'field_id_north_east',
                                data_type: 'field'
                            };
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.sw_field_id',
                        onInit: function (settingScope, fieldModel) {

                            settingScope.$watch(function () {
                                return fieldModel.data_model.app_id;
                            }, function (newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });

                        },
                        data_model: function (fieldModel) {
                            return {
                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                },
                                field_name: 'South-West coords',
                                name_space: 'field_id_south_west',
                                data_type: 'field'
                            };
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.hover_view_id',
                        onInit: function (settingScope) {
                            scope.$watch(
                                function () {
                                    return scope.fieldModel.data_model.app_id;
                                },
                                function (newValue) {
                                    settingScope.field_model.data_model.app_id = newValue;
                                }
                            );
                        },
                        data_model: function (fieldModel) {
                            return {
                                data_model: {
                                    app_id: fieldModel.data_model.app_id,
                                },
                                field_name: 'View For Hover',
                                name_space: 'view_hover_name',
                                data_type: 'view_list',
                            };
                        },
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.click_view_id',
                        onInit: function (settingScope) {
                            scope.$watch(
                                function () {
                                    return scope.fieldModel.data_model.app_id;
                                },
                                function (newValue) {
                                    settingScope.field_model.data_model.app_id = newValue;
                                }
                            );
                        },
                        data_model: function (fieldModel) {
                            return {
                                data_model: {
                                    app_id: fieldModel.data_model.app_id,
                                },
                                field_name: 'View For Click',
                                name_space: 'view_click_name',
                                data_type: 'view_list',
                            };
                        },
                    },
                ]
            ]
        }];
    }
}