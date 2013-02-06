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
            var chaine = "<table id='" + this._getId("table") + "'>";
            chaine += "<tr id='" + this._getId('controlBar') + "'><td><ul id='" + this._getId("navBar") + "' style='list-style:none;margin: 0;'>";
            chaine += "<li class='ui-state-default' id='" + this._getId("spinner")
                    + "' style='float:left;margin-right:2px;text-decoration: none;'>"
                    + "<span class='ui-widget ui-corner-all ui-icon ui-button' style='background-image: url(\"lib/jquery.table/ajax-loader.gif\");'></span></li>";

            for (var i = 0; i < this.options.controls.length; i++) {
                chaine += this._getControl(this.options.controls[i]['id'], this.options.controls[i]['icon']);
            }
            chaine += "<li id='" + this._getId('info') + "'></li>";
            chaine += "</ul></td></tr>";
            chaine += "<tr id='" + this._getId('header') + "'></tr>";
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
            var classe = this._getId('controls');
            // tous les controles ont la classe <nom>_controls
            // on leur rajoute l'appel de la methode correspondante
            $('.' + classe).click(
                    function() {
                        var methode = $(this).attr('id').replace(new RegExp('^' + self.options.name + '_'), '');
                        self[methode]();
                    });
        },
        destroy: function() {
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
            this._setOption('filter',null);
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
        // renvoie un controle sous forme de <li>
        _getControl: function(id, icon) {
            var classe = this._getId('controls');
            var chaine = "<li class='" + classe + " ui-state-default ui-corner-all' id='" + this._getId(id)
                    + "' style='float:left;margin-right:2px;text-decoration: none;'>"
                    + "<span class='ui-widget ui-corner-all ui-icon ui-button " + icon + "' title='" + id
                    + "'></span></li>";

            return chaine;
        },
        _createHeader: function() {
            // on supprime l'ancien si besoin
            $('#' + this._getId('header')).empty();
            var chaine = ""; //"<tr id='"+this._getId('header')+"'>";
            var cols = this.options.columns;
            var self = this;
            var sort;
            var filter;

            filter = "<div class='filter ui-icon ui-icon-search'></div>";
            sort = "<div class='sort ui-icon ui-icon-triangle-2-n-s'></div>";
            for (var i = 0; i < cols.length; i++) {
                chaine += "<th field='" + cols[i]['id'] + "'><div class='title_div'>" + cols[i]['label'] + "</div>" + filter + sort + '</th>';
            }
            $('#' + this._getId('controlBar') + ' td').attr('colspan', cols.length);
            var ctrl_id = '#' + this._getId('header')

            $(ctrl_id).append(chaine);
            // click sur le titre pour tri
            $(ctrl_id + ' .title_div').click(function() {
                var current_sort = '';
                if (self.options.sort != null) {
                    current_sort = self.options.sort.split(' ');
                    $(this).parent().parent().children().children('div.sort').removeClass('ui-icon-triangle-1-s').removeClass('ui-icon-triangle-1-n').addClass('ui-icon-triangle-2-n-s');
                }
                var champ = $(this).parent().attr('field');
                var sens = 'asc';
                var classe = 'ui-icon-triangle-1-n';
                if (current_sort[0] == champ) {

                    if (current_sort[1] == 'desc') {
                        sens = 'asc';
                    } else {
                        sens = 'desc';
                    }

                }
                classe = (sens == 'desc') ? 'ui-icon-triangle-1-s' : 'ui-icon-triangle-1-n';
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
            $('#' + this._getId('input')).width(element.parent().width()-4).height(element.parent().children(':first').height()-4).position({
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
                //$('#' + self._getId('input')).remove();
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
        }

    });

    $.extend($.ui.table, {});

})(jQuery);

function DataProvider(baseurl) {
    this.baseurl = baseurl;
}

DataProvider.prototype.getColumns = function(table) {
    table.beginAjax();
    $.getJSON(this.baseurl + '?action=columns&token=' + token, function(res) {
        table._setOption('columns', res);
        table.endAjax();
    });
}

DataProvider.prototype.getData = function(table, start, size, sort, filter) {
    table.beginAjax();
    var sortString = (sort == null) ? '' : '&sort=' + sort;
    var filterString = (filter == null) ? '' : '&filter=' + JSON.stringify(filter);

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


//});
}
DataProvider.prototype.getCount = function(table) {
    table.beginAjax();
    var filter = table.options.filter;
    var filterString = (filter == null) ? '' : '&filter=' + JSON.stringify(filter);
    $.getJSON(this.baseurl + '?action=count' + filterString + '&token=' + token, function(res) {
        table._setOption('count', res);
        table.endAjax();
    });
}


