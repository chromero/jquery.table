(function($) {

    $
	    .widget(
		    "ui.filterbuilder",
		    {
			options : {
			    name : "table",
			    columns : {},
			    current_filter : new FilterDescriptor()
			},

			_create : function() {
			    var self = this;
			    //if(this.options.current_filter==null) {
				//this.options.current_filter = FilterDescriptor();
			    //}
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
			    $("#" + this.options.name + "_filter").dialog({
				width : 600,
				height : 400
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
					filter[i].op,
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
					var rank = $(this).parent().parent()
						.attr('rank');
					self.options.current_filter.remove(
						rank, rank);
					$(this).parent().parent().remove();
				    });
			    $('.filtercontainer table tbody').sortable();
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
    this.content.splice(rank,rank);
}
