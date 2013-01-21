(function($) {

    $
	    .widget(
		    "ui.filterbuilder",
		    {
			options : {
			    name : "table",
			    columns : {},
			    current_filter : [
			         // {field:'name',caption:'Nom',op:'=',value:'val'}
			        ]
			},

			_create : function() {
			    var self = this;
			    this._html = "<DIV id='" + this.options.name
				    + "_filter' class='filterbuilder'>";
			    this._html += "<div class='columnlistcontainer'><UL id='columnlist' class='filterbuildercolumns connectedSortable'>";
			    // this._html += "<li class='ui-state-default'>Item
			    // 1</li>";
			    for ( var col in this.options.columns) {
				this._html += "<li class='test ui-state-default' field='"
					+ col
					+ "'>"
					+ this.options.columns[col] + "</li>";
			    }
			    this._html += "</ul></div>";
			    this._html += "<div class='filtercontainer'><table id='filter' class='connectedSortable'>";
			    //this._html += "<li class='ui-state-default'>Item x</li>";
			    this._html += "</table></div>";
			    this.element.append(this._html);
			    $("#columnlist li").draggable({
				// connectWith : ".connectedSortable"
				//revert : true,
				revertDuration : 10,
				cursor: 'move',          // sets the cursor apperance
				revert: true, 
			    });
			    $('.filtercontainer').droppable({
				accept : ".test",
				activeClass : "ui-state-highlight",
				drop : function(event, ui) {
				    self.options.current_filter.push({field:ui.draggable.attr('field'),caption:ui.draggable.html(),op:'=',value:'val'});
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
			    var filter = this.options.current_filter;
			    var html='';
			    for(var i=0;i<filter.length;i++) {
				html += "<TR rank='"+i+"'><td field='"+filter[i].field+"'>"+filter[i].caption+'</td><td>'+filter[i].op+'</td><td>'+filter[i].value+'</td><TD><span class="ui-icon ui-icon-circle-minus removeFilter" title="filtre"></span></TD></TR>';
			    }
			    $('#filter').empty().append(html);
			    $('.removeFilter').click(function(){
				var rank = $(this).parent().parent().attr('rank');
				self.options.current_filter.splice(rank,rank);
				$(this).parent().parent().remove();
			    });
			    //$('.filtercontainer table tr').sortable();
			}
		    });

    $.extend($.ui.table, {});

})(jQuery);