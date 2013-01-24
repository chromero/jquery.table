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

    $
	    .widget(
		    "ui.filterbuilder",
		    {
			options : {
			    name : "table",
			    columns : {},
			    current_filter : new FilterDescriptor(),
			    owner : null
			},

			_create : function() {
			    var self = this;
			    this._html = "<DIV id='" + this.options.name
				    + "_filter' class='filterbuilder'>";
			    this._html += "<div class='columnlistcontainer'><UL id='columnlist' class='filterbuildercolumns connectedSortable'>";
			    for ( var col in this.options.columns) {
				this._html += "<li class='test ui-state-default' field='"
					+ col
					+ "'>"
					+ this.options.columns[col] + "</li>";
			    }
			    this._html += "</ul></div>";
			    this._html += "<div class='filtercontainer'><table id='filter' class='connectedSortable'>";
			    // this._html += "<li class='ui-state-default'>Item
			    // x</li>";
			    this._html += "</table></div>";
			    this.element.append(this._html);
			    $("#columnlist li").draggable({
				// connectWith : ".connectedSortable"
				// revert : true,
				revertDuration : 10,
				cursor : 'move', // sets the cursor apperance
				revert : true,
			    });
			    $('.filtercontainer').droppable({
				accept : ".test",
				activeClass : "ui-state-highlight",
				drop : function(event, ui) {
				    self.options.current_filter.add(ui.draggable.attr('field'),
					ui.draggable.html(), '=', 'val');
				    self._refresh();
				}
			    });
			    self._refresh();
			    $("#" + this.options.name + "_filter").dialog({
				width : 600,
				height : 400,
				title : 'Filtre',
				modal : true,
				buttons : {
					"Ok" : function() {
						$(this).dialog("close");
						self.options.owner._setOption('filter',this.options.current_filter);
					},
					"Annuler" : function() {
						$(this).dialog("close");
					}
				}
			    });
			},

			_init : function() {
			},

			_setOption : function(key, value) {
			    this.options[key] = value;
			},

			_refresh : function() {
			    var self = this;
			    var filter = this.options.current_filter.get();
			    var html = '';
			    for ( var i = 0; i < filter.length; i++) {
				html += [
					"<TR rank='",
					i,
					"'><td field='",
					filter[i].field,
					"'>",
					filter[i].caption,
					'</td><td>',
					this._getSelect(filter[i].op),
					"</td><td><input type='text' name='",
					this.options.name,
					'filter',
					i,
					"' value='",
					filter[i].value,
					"'/></td><TD><span class='ui-icon ui-icon-circle-minus removeFilter' title='filtre'></span></TD></TR>" ]
					.join('');
			    }
			    $('#filter').empty().append(html);
			    $('.removeFilter').click(
				    function() {
					var rank = $(this).parent().parent().attr('rank');
					self.options.current_filter.remove(rank);
					//$(this).parent().parent().remove();
					self._refresh();
				    });
			    $('.filtercontainer table tbody').sortable();
			},
			_getSelect : function(defValue) {
			    var tab = ['=','!=','<','>','<=','>=','like','in','not like','not in'];
			    var html = '<select>';
			    for ( var int = 0; int < tab.length; int++) {
				  html += '<option ';
				  if(defValue==tab[int]) {
				      html += 'selected ';
				  }
				  html += 'value="'+tab[int]+'">'+tab[int]+'</option>'
			    }
			    html += '</select>';
			    return html;
			}
		    });

    $.extend($.ui.table, {});

})(jQuery);

/**
 * Classe FilterDescriptor constructeur
 */
function FilterDescriptor(relation) {
    this.content = [];
    
    if(typeof(relation)=='undefined') {
	relation='AND';
    }
    this.relation = relation;
}

FilterDescriptor.prototype.add = function(field,caption,operator,value) {
    if(field instanceof FilterDescriptor) {
	this.content.push(field);
    } else {
	this.content.push({field:field,caption:caption,op:operator,value:value});
    }
}

FilterDescriptor.prototype.get = function() {
    return this.content;
}

FilterDescriptor.prototype.remove = function(rank) {
    this.content.splice(rank,1);
}

