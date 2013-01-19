
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
		options : {
			name : "table",
			default_controls : [ {
				id : 'first',
				icon : 'ui-icon-arrowthickstop-1-w'
			},{
				id : 'previous',
				icon : 'ui-icon-arrowthick-1-w'
			},{
				id : 'next',
				icon : 'ui-icon-arrowthick-1-e'
			}, {
				id : 'last',
				icon : 'ui-icon-arrowthickstop-1-e'
			} ],
			controls : [],
			page_size : 30,
			page : 1,
			page_count: 1,
			oddclass: 'table_odd',
			evenclass: 'table_even',
			sort: null,
			columns: null
		},

		_init : function() {
		},

		_create : function() {
            $(this).data('old_content', this.element.html());
		    this.options.oddcolor = $('.ui-state-default').css('background-color');
			this.options.controls = this.options.default_controls.concat(this.options.controls);
			// creation de la barre de navigation
            var chaine = "<table id='" + this._getId("table") + "'>";
			chaine += "<tr id='"+this._getId('controlBar')+"'><td><ul id='" + this._getId("navBar") + "' style='list-style:none;margin: 0;'>";
			for ( var i = 0; i < this.options.controls.length; i++) {
				chaine += this._getControl(this.options.controls[i]['id'], this.options.controls[i]['icon']);
			}
			chaine += "<li id='"+this._getId('info')+"'></li>";
			chaine += "</ul></td></tr>";
			chaine += "<tr id='"+this._getId('header')+"'></tr>";
			chaine += "</table>";
			this.element.html(chaine);
			this.options.provider.getCount(this);
			this.options.provider.getColumns(this);
			this.getValues();
			var self = this;
			var classe = this._getId('controls');
			$('.' + classe).click(

			function() {
				var methode = $(this).attr('id').replace(new RegExp('^' + self.options.name + '_'), '');
				self[methode]();
			});
		},
        destroy: function(){
			this.element.html($(this).data('old_content'));
			// call the original destroy method since we overwrote it
			$.Widget.prototype.destroy.call( this );
		},

		first : function() {
			this._setOption('page', 1);
		},
		next : function() {
			this._setOption('page', Math.min( this.options.page + 1, this.options.page_count));
		},
		previous : function() {
			this._setOption('page', Math.max( this.options.page - 1,1));
		},
		last : function() {
			this._setOption('page', this.options.page_count);
		},
		_setOption : function(key, value) {
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
				this.options.page_count = Math.ceil( value / this.options.page_size);
				this._updateInfo();
				break;
			case 'values':
				this._setValues(value);
				break;
			case 'sort':
				this._setSort(value);
				break;
			}
		},

		_getControl : function(id, icon) {
			var classe = this._getId('controls');
			var chaine = "<li class='" + classe + " ui-state-default ui-corner-all' id='" + this._getId(id)
					+ "' style='float:left;margin-right:2px;text-decoration: none;'>"
					+ "<span class='ui-widget ui-corner-all ui-icon ui-button " + icon + "' title='" + id
					+ "'></span></li>";

			return chaine;
		},

		_createHeader : function() {
            // on supprime l'ancien si besoin
            $('#'+this._getId('header')).empty();
			var chaine = ""; //"<tr id='"+this._getId('header')+"'>";
			var cols = this.options.columns;
			var self = this;
			var sort;
            $('#'+this._getId('controlBar')+' td').attr('colspan',cols.length);
			for ( var i = 0; i < cols.length; i++) {
				sort = "<div class='ui-icon ui-icon-triangle-2-n-s' style='float:right; vertical-align:middle;'></div>";
				chaine += "<th name='"+cols[i]+"'><div style='float:left;'>" + cols[i] +"</div>"+ sort+'</th>';
			}
			//chaine += '</tr>';
			//$('#' + this._getId("table")).append(chaine);
            var ctrl_id = '#'+this._getId('header')

            $(ctrl_id).append(chaine);
			$(ctrl_id+' th').click(function() {
                var sens = 'asc';
                var classe='ui-icon-triangle-1-n';
                if ($(this).children('.ui-icon').hasClass('ui-icon-triangle-1-n')) {

                    sens='desc';
                    classe='ui-icon-triangle-1-s';
                    }
                $(ctrl_id+' th').children('.ui-icon').removeClass('ui-icon-triangle-1-s ui-icon-triangle-1-n').addClass('ui-icon-triangle-2-n-s');
                $(this).children('.ui-icon').removeClass('ui-icon-triangle-2-n-s').addClass(classe);
				self._setOption('sort',($(this).attr('name')+' '+sens));
			});
		},

		getValues : function() {
			var min = (this.options.page - 1) * this.options.page_size;
			this.options.provider.getData(this, min, this.options.page_size, this.options.sort);
		},
		_setValues: function(values) {
			var chaine = '';
			$('.' + this._getId("values")).remove();
			for ( var i = 0; i < values.length; i++) {
				chaine += "<tr class='" + this._getId("values")+"'>";
				for ( var j = 0; j < values[i].length; j++) {
					chaine += '<td>' + values[i][j] + '</td>';
				}
				chaine += '</tr>';
			}
			$('#' + this._getId("table")).append(chaine);
			$('.'+this._getId("values")+':odd').addClass(this.options.oddclass);
			$('.'+this._getId("values")+':even').addClass(this.options.evenclass);
		},
		_setSort: function(value) {
			this.getValues();
            $('#'+this._getId('header')+' th div:ui-icon').removeClass('ui-icon-triangle-2-n-s ui-icon-triangle-1-s ui-icon-triangle-1-n')

		},
		_updateInfo: function() {
			var texte = 'page '+this.options.page+' / '+this.options.page_count + ' - '+
			this.options.count+ ' enregistrements';
			$('#'+this._getId('info')).html(texte);

		},
		_getId : function(id) {
			return this.options.name + '_' + id;
		}

	});

	$.extend($.ui.table, {});

})(jQuery);

function DataProvider(baseurl) {
	this.baseurl = baseurl;
}

DataProvider.prototype.getColumns = function(table) {
	$.getJSON(this.baseurl+'?action=columns&token='+token, function(res) {
	   table._setOption('columns',res);
	    });
}

DataProvider.prototype.getData = function(table, start, size, sort) {
	var sortString=(sort==null)?'':'&sort='+sort;
//	$.getJSON(this.baseurl+'?action=list&limit='+start+','+size+sortString+'&token='+token, function(res) {
//	    table._setOption('values',res);

    $.ajax({
    url: this.baseurl+'?action=list&limit='+start+','+size+sortString+'&token='+token,
    success: function(texte){
            var regexp = /(\[\[.*\]\]).*/;
            var match = regexp.exec(texte);
            var json = $.parseJSON(match[1]);
            table._setOption('values',json);
        }
    });


//});
}
DataProvider.prototype.getCount = function(table) {
	$.getJSON(this.baseurl+'?action=count&token='+token, function(res) {
	    table._setOption('count',res);
	    });
}


