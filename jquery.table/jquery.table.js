/*
 * Copyright (c) 2013 ROMERO Christophe (chromero).  All rights reserved.
 * jquery.table.js is a part of jquery.table library
 * ====================================================================
 * 
 * jquery.table library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public License as 
 * published by the Free Software Foundation, either version 3 of the License,
 * or any later version.
 * 
 * This is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, see <http://www.gnu.org/licenses/>.
 */

/*
 * voir http://chromero.blogspot.fr/search/label/jQueryTable
 */

(function($) {

    $.widget("ui.table", {
        options: {
            name: "table",
            template: {
                navbar_pre: '<div id="$id_controlBar"><ul id="$id_navBar" style="list-style:none;margin: 0;">',
                navbar_post: '</ul></div><div style="clear:both;"></div>',
                navbaritem: '<li class="table_controls ui-state-default ui-corner-all" id="$id_$nom" style="float:left;margin-right:2px;text-decoration: none;"><span class="ui-widget ui-corner-all ui-icon ui-button $class" title="$nom"></span></li>',
                column_header: '<th field="$field"><div class="table_header_div">$field_name</div><div class="table_filter ui-icon ui-icon-search"></div><div class="table_sort ui-icon ui-icon-triangle-2-n-s"></div></th>'
            },
            default_controls: [{
                    id: 'first',
                    icon: 'ui-icon-arrowthickstop-1-w'
                }, {
                    id: 'previous',
                    icon: 'ui-icon-arrowthick-1-w'
                }, {
                    id: 'next',
                    icon: 'ui-icon-arrowthick-1-e'
                }, {
                    id: 'last',
                    icon: 'ui-icon-arrowthickstop-1-e'
                }, {
                    id: 'reset_filter',
                    icon: 'ui-icon-circle-close'
                }/*, {
                 id : 'filter',
                 icon : 'ui-icon-search'
                 } */],
            controls: [],
            page_size: 30,
            page: 1,
            page_count: 1,
            filter: null, // filter [{}, ..]
            oddclass: 'table_odd',
            evenclass: 'table_even',
            sort: null, // tri
            columns: null, // liste des colonnes
            ajaxLoading: 0          // pour l'icone
        },
        _init: function() {
        },
        /**
         *
         * _create
         *
         **/
        _create: function() {
            // sauvegarde du contenu précédent de l'élément'
            $(this).data('old_content', this.element.html());
            // Liste des controles de la barre de navigation
            this.options.controls = this.options.default_controls.concat(this.options.controls);
            // creation de la barre de navigation
            // ajout du spinner, puis des controles
             var chaine = this._template("navbar_pre");
            chaine += this._getHtml("li", "spinner"," class='table_spinner'");
            chaine += "<span class='ui-widget ui-corner-all ui-icon ui-button' ></span></li>";

            var ctrls = this.options.controls;
            for (var i = 0; i < ctrls.length; i++) {
                chaine += this._template("navbaritem", {nom: ctrls[i].id, class: ctrls[i].icon});
            }
            chaine += this._getHtml("li", "info", "") + "</li>";
            chaine += this._template("navbar_post");
            chaine += "<table id='" + this._getId("table") + "'>";
            chaine += this._getHtml("tr", "header", "") + "</tr>";
            chaine += "</table>";
            // on met à jour l'élément pour l'afficher
            this.element.html(chaine);
            // on récupère le nombre d'enregistrement
            this.options.provider.getCount(this);
            // ainsi que la liste des colonnes
            this.options.provider.getColumns(this);
            // récupérer les données
            this.getValues();
            var self = this;
            // tous les controles ont la classe <nom>_controls
            // on leur rajoute l'appel de la methode correspondante
            $("#"+this._getId('navBar')+" .table_controls").click(
                    function() {
                        var methode = $(this).attr('id').replace(new RegExp('^' + self.options.name + '_'), '');
                        self[methode]();
                    });
        },
        destroy: function() {
            // on restaure le contenu original
            this.element.html($(this).data('old_content'));
            // call the original destroy method since we overwrote it
            $.Widget.prototype.destroy.call(this);
        },
        // méthodes correspondantes aux boutons de navigation
        first: function() {
            this._setOption('page', 1);
        },
        next: function() {
            this._setOption('page', Math.min(this.options.page + 1, this.options.page_count));
        },
        previous: function() {
            this._setOption('page', Math.max(this.options.page - 1, 1));
        },
        last: function() {
            this._setOption('page', this.options.page_count);
        },
        reset_filter: function() {
            this._setOption('filter', null);
        },
        /* filter : function() {
         $('#test').filterbuilder({
         name : 'filter',
         owner: this,
         columns: this.options.columns,
         current_filter: this.options.filter
         });
         },
         */
        _setOption: function(key, value) {
            this.options[key] = value;
            switch (key) {
                case 'page':
                    this.getValues();
                    this._updateInfo();
                    break;
                case 'columns':
                    this._createHeader();
                    break;
                case 'count':
                    this.options.page_count = Math.max(1, Math.ceil(value / this.options.page_size));
                    this._updateInfo();
                    break;
                case 'values':
                    this._setValues(value);
                    break;
                case 'sort':
                    this._setSort(value);
                    break;
                case 'filter':
                    this._setFilter();
                    break;
            }
        },
        _createHeader: function() {
            // on supprime l'ancien si besoin
            var ctrl_id = '#' + this._getId('header');

            $(ctrl_id).empty();
            var chaine = "";
            // [{id:xxx,label:xxx,type:xxx},{....}]
            // ou
            // [[{label:xxx,colspan:xxx},...],
            // [{id:xxx,label:xxx,type:xxx},{....}]
            // ]
            // si header multilignes, on commence par ça
            var cols = this.options.columns;

            if (cols[0] instanceof Array) {
                for (var i = 0; i < cols.length - 1; i++) {
                    chaine += '<TR>';
                    for (var j = 0; j < cols[i].length; j++) {
                        chaine += '<TD class="' + this._getId('preheader') + '" colspan="' + cols[i][j].colspan + '">' + cols[i][j].label + '</TD>';
                    }
                    chaine += '</TR>';
                }
                cols = cols[i];
            }
            $(chaine).insertBefore($(ctrl_id));
            var self = this;
            var sort;
            var filter;

            chaine = '';
            filter = "<div class='filter ui-icon ui-icon-search'></div>";
            sort = "<div class='sort ui-icon ui-icon-triangle-2-n-s'></div>";
            for (var i = 0; i < cols.length; i++) {
                chaine += "<th field='" + cols[i]['id'] + "'><div class='title_div'>" + cols[i]['label'] + "</div>" + filter + sort + '</th>';
            }
            $('#' + this._getId('controlBar') + ' td').attr('colspan', cols.length);
            $(ctrl_id).append(chaine);
            // click sur le titre pour tri
            $(ctrl_id + ' .title_div').click(function() {
                var current_sort = '';
                if (self.options.sort !== null) {
                    current_sort = self.options.sort.split(' ');
                    $(this).parent().parent().children().children('div.sort').removeClass('ui-icon-triangle-1-s').removeClass('ui-icon-triangle-1-n').addClass('ui-icon-triangle-2-n-s');
                }
                var champ = $(this).parent().attr('field');
                var sens = 'asc';
                var classe = 'ui-icon-triangle-1-n';
                if (current_sort[0] === champ) {

                    if (current_sort[1] === 'desc') {
                        sens = 'asc';
                    } else {
                        sens = 'desc';
                    }

                }
                classe = (sens === 'desc') ? 'ui-icon-triangle-1-s' : 'ui-icon-triangle-1-n';
                $(this).parent().children('.sort').removeClass('ui-icon-triangle-2-n-s').addClass(classe);
                self._setOption('sort', (champ + ' ' + sens));
            });
            // click sur filtrer = appel de showFilter
            $('.filter').click(function() {
                self.showFilter($(this));
            });
        },
        // affiche un input sur le header correspondant
        showFilter: function(element) {
            var self = this;
            var field = element.parent().attr('field');
            var html = '<INPUT id="' + this._getId('input') + '" class="filter_input" type="text" />';
            $('#' + this._getId('header')).append(html);
            $('#' + this._getId('input')).width(element.parent().width() - 4).height(element.parent().children(':first').height() - 4).position({
                my: 'center',
                at: 'center',
                of: element.parent()
            }).focus();
            $('#' + this._getId('input')).keydown(function(event) {
                switch (event.which) {
                    case 13:
                        // appliquer le fitre
                        var fd = new FilterDescriptor('AND');
                        fd.add(field, element.html(), 'like', $('#' + self._getId('input')).val());
                        self._setOption('filter', fd);
                    case 27:
                        $('#' + self._getId('input')).remove();
                        break;
                }

                //event.preventDefault();
            }).blur(function() {
                $('#' + self._getId('input')).remove();
            });
        },
        // récupère les données correspondantes à la page courante au tri et au filtre en cours
        getValues: function() {
            var min = (this.options.page - 1) * this.options.page_size;
            // TODO passer uniquement this et récupérer les infos
            this.options.provider.getData(this, min, this.options.page_size, this.options.sort, this.options.filter);
        },
        // début ajax (affiche le spinner)
        beginAjax: function() {
            this.options.ajaxLoading++;
            if (this.options.ajaxLoading > 0) {
                $('#' + this._getId('spinner')).css('visibility', 'visible');
            }
        },
        // fin ajax (cache le spinner)
        endAjax: function() {
            this.options.ajaxLoading--;
            if (this.options.ajaxLoading <= 0) {
                $('#' + this._getId('spinner')).css('visibility', 'hidden');
            }
        },
        // on a récupéré les valeurs (donnée en ajax)
        // on met à jour l'écran
        _setValues: function(values) {
            var chaine = '';
            $('.' + this._getId("values")).remove();
            for (var i = 0; i < values.length; i++) {
                chaine += "<tr class='" + this._getId("values") + "'>";
                for (var j = 0; j < values[i].length; j++) {
                    chaine += '<td>' + values[i][j] + '</td>';
                }
                chaine += '</tr>';
            }
            $('#' + this._getId("table")).append(chaine);
            $('.' + this._getId("values") + ':odd').addClass(this.options.oddclass);
            $('.' + this._getId("values") + ':even').addClass(this.options.evenclass);
        },
        _setSort: function(value) {
            // on a mis à jour le tri, on récupère les données
            this.getValues();
        },
        _setFilter: function() {
            // on a mis à jour le filtre, on récupère les données ainsi que le count
            this.options.page = 1;
            this.options.provider.getCount(this);
            this.getValues();
        },
        // met à jour les infos supplémentaires
        _updateInfo: function() {
            var texte = 'page ' + this.options.page + ' / ' + this.options.page_count + ' - ' +
                    this.options.count + ' enregistrements';
            $('#' + this._getId('info')).html(texte);

        },
        // renvoie un id avec comme préfixe le nom de la table
        _getId: function(id) {
            return this.options.name + '_' + id;
        },
        /**
         * renvoie un element html
         * @param {String} element : l'élément à ajouter (ex: LI, TD,..)
         * @param {String} id id de l'élement (auquel on ajoute le nom en prefixe)
         * @param {String} attributes : attributs a ajouter
         * @returns {String} le html de l'élement correspondant
         */
        _getHtml: function(element, id, attributes) {
            var html = "<" + element + " id='" + this._getId(id) + "' " + attributes + ">";
            return html;
        },
        _template: function(nom, valeurs) {
            if (typeof(valeurs) === 'undefined') {
                valeurs = {};
            }
            var chaine = this.options.template[nom];
            var values = $.extend(valeurs, {id: this.options.name});
            for (var keys in values) {
                var regexp = new RegExp('\\$' + keys,'g');
                chaine = chaine.replace(regexp, values[keys]);
            }
            return chaine;
        }

    });

    $.extend($.ui.table, {});

})(jQuery);


/**
 * @class FilterDescriptor
 * @constructor
 * @argument {string} relation ( 'AND' ou 'OR )
 */

function FilterDescriptor(relation) {
    this.content = [];

    if (typeof(relation) === 'undefined') {
        relation = 'AND';
    }
    this.relation = relation;
}

/**
 * 
 * @function
 * @argument {mixed} string: field champ, ou FilterDescriptor
 * @argument {string} caption nom affiché
 * @argument {string} operator <,>,<=,like,...
 * @argument {string} value valeur
 * 
 */
FilterDescriptor.prototype.add = function(field, caption, operator, value) {
    if (field instanceof FilterDescriptor) {
        this.content.push(field);
    } else {
        this.content.push({
            field: field,
            caption: caption,
            op: operator,
            value: value
        });
    }
}

/**
 * @function get renvoie le contenu du filtre
 */

FilterDescriptor.prototype.get = function() {
    return this.content;
}

/**
 * 
 * @function remove supprime l'item de rang rank
 * @argument {int} rank rang de l'item à supprimer
 */
FilterDescriptor.prototype.remove = function(rank) {
    this.content.splice(rank, 1);
}


/**
 * 
 * @class DataProvider
 *      Exemple de classe de récupération des données
 *      
 * @param {string} baseurl url de base pour la récupération
 */

function DataProvider(baseurl) {
    this.baseurl = baseurl;
}

/**
 * @function getColumns
 * 
 * retourne la liste des colonnes de la table (appel ajax)
 * @param {object} table objet jQuery table qui recoit la liste des colonnes
 * 
 */
DataProvider.prototype.getColumns = function(table) {
    table.beginAjax();
    $.getJSON(this.baseurl + '?action=columns&token=' + token, function(res) {
        table._setOption('columns', res);
        table.endAjax();
    });
};

/**
 * 
 * @function getData
 * 
 */

DataProvider.prototype.getData = function(table, start, size, sort, filter) {
    table.beginAjax();
    var sortString = (sort === null) ? '' : '&sort=' + sort;
    var filterString = (filter === null) ? '' : '&filter=' + JSON.stringify(filter);

    $.ajax({
        url: this.baseurl + '?action=list&limit=' + start + ',' + size + sortString + filterString + '&token=' + token,
        success: function(texte) {
            try {
                var regexp = /(\[.*\]).*/;
                var match = regexp.exec(texte);
                var json = $.parseJSON(match[1]);
                table._setOption('values', json);
            } catch (err) {

            }
            table.endAjax();
        }
    });
};

DataProvider.prototype.getCount = function(table) {
    table.beginAjax();
    var filter = table.options.filter;
    var filterString = (filter === null) ? '' : '&filter=' + JSON.stringify(filter);
    $.getJSON(this.baseurl + '?action=count' + filterString + '&token=' + token, function(res) {
        table._setOption('count', res);
        table.endAjax();
    });
};
