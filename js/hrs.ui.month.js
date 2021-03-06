hrs = window.hrs || {};
hrs.ui = window.hrs.ui || {};

hrs.ui.month = function(month, year) {
	var public = {};
	
	var _dao = null;
	
	var _helpers = hrs.helpers,
		_dateHelpers = hrs.helpers.dateTime;
	
	var _updatedRowCallback = null;
	
	function _getRowInfo(date){
		var dateInfo = _dao.getDateInfo(date);
		var observation = dateInfo.obs;
		if(observation == "" && dateInfo.holiday && dateInfo.holiday.obs != ""){
			observation = dateInfo.holiday.obs;
		}
		
		return {
			data: _dateHelpers.formatDate(date, '#d/#M'),
			diaSemana: _dateHelpers.weekDay(date.getDay()),
			entrada: _dateHelpers.formatDate(dateInfo.entrada, '#h:#m'),
			ida_almoco: _dateHelpers.formatDate(dateInfo.ida_almoco, '#h:#m'),
			volta_almoco: _dateHelpers.formatDate(dateInfo.volta_almoco, '#h:#m'),
			saida: _dateHelpers.formatDate(dateInfo.saida, '#h:#m'),
			total: _handleUndefinedDate(dateInfo.total),
			almoco: _handleUndefinedDate(dateInfo.almoco),
			excedente: _handleUndefinedDate(dateInfo.extra),
			holiday: dateInfo.holiday != null,
			obs : observation 
		};
	}
	
	function _handleUndefinedDate(date){
		return date == undefined ? '' : date.toString();
	}
	
	function _buildRow(date, $target, $template){
		var rowData = _getRowInfo(date);
		var cssClass = ($target.find('tr').length % 2 != 0) ? 'even' : '';
		
		if(_dateHelpers.isWeekend(date)){
			cssClass += ' weekend';
		}
		
		if(rowData.holiday) {
			cssClass += ' holiday';
		}
			
		if(cssClass != '') {
			cssClass = 'class="' + cssClass + '"';
		}
		
		var rowContent = '<tr id="' + date.getTime() + '"' + cssClass + '>' + $template.html() + '</tr>';
		
		for(var k in rowData){
			rowContent = rowContent.split('{' + k + '}').join(rowData[k]);
		}
		
		var $rowContent = $(rowContent);
		$rowContent.find('input').change(changeEvent).filter(':not(.obs)').blur(blurEvent);
		
		$target.append($rowContent);
	}
	
	function changeEvent(e){
		var $row = $(e.target).closest('tr');
		var rowDate = new Date(parseInt($row.attr('id')));
			
		console.log($row.find('.lunch-start').val());
		
		_dao.storeDate(rowDate, {
			entrada: _dateHelpers.parseDateTime($row.find('.start').val(), rowDate),
			ida_almoco: _dateHelpers.parseDateTime($row.find('.lunch-start').val(), rowDate),
			volta_almoco: _dateHelpers.parseDateTime($row.find('.lunch-end').val(), rowDate),
			saida: _dateHelpers.parseDateTime($row.find('.end').val(), rowDate),
			obs: $row.find('.obs').val()
		});
		
		var info = _getRowInfo(rowDate);
		$row.find('.total').html(info.total);
		$row.find('.excedente').html(info.excedente);
		$row.find('.almoco').html(info.almoco);
		
		if(_updatedRowCallback != null) _updatedRowCallback($row, info);
	}
	
	function blurEvent(e){
		var $input = $(e.target);
		var value = $input.val();
		
		if(value == "")
			return;
		
		if(value.indexOf(':') == -1){
			value +=  ':0';
		}
		
		value = value.replace(/[^\d:]/g, "");
		
		var arrTime = value.split(':');
		
		arrTime[0] = _helpers.number.addZeros(arrTime[0], 2);
		arrTime[1] = _helpers.number.addZeros(arrTime[1], 2);
		
		$input.val(arrTime.join(':'));
		
	}
	
	public.setDao = function(dao){
		_dao = dao;
	};
	
	public.setUpdatedRowCallback = function(fn){
		_updatedRowCallback = fn;
	};
	
	public.print = function($target){
		var date = new Date(year, month, 1);
		var $tmpl = $("#row-template", $target);
		
		$target.find('tr:not(.fixed-row)').remove();
		while(date.getMonth() == month) {
			_buildRow(date, $target, $tmpl);
			var prev = date.getDate();
			date.setDate(prev + 1);
			//if(date.getDate())
		}
	};
	
	return public;
};