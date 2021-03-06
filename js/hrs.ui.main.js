hrs = window.hrs || {};
hrs.ui = window.hrs.ui || {};

hrs.ui.main = (function($, helpers, dao){
	var public = {};
	
	var currentDate = null,
		currentMonth = null,
		$container = null,
		lightboxIndex = 3;
	
	public.init = function($elm){
		$container = $elm;
		currentDate = new Date();
		buildMonth();
		settings();
		lightbox();
		monthInformation();
		importExport();
		holidays();
	};
	
	function buildMonth(){
		currentMonth = new hrs.ui.month(currentDate.getMonth(), currentDate.getFullYear());
		currentMonth.setDao(dao);
		currentMonth.setUpdatedRowCallback(updateInfo);
		currentMonth.print($container);
		
		$("#main-table tr").each(function(){
			var $row = $(this);
			formatValue($row.find('.total, .excedente'), $row.find('.excedente').html());
		});
		
		updateInfo();
	}
	
	function updateInfo($row, rowData){
		var totals = dao.calculateTotals(currentDate.getMonth());
		$("#extra").html(totals.extra.toString());
		$("#worked").html(totals.total.toString());
		$("#extra-month").html(totals.extraMonth.toString());
		$("#total-month").html(totals.totalMonth.toString());
		$("#month-name").html(helpers.dateTime.formatDate(currentDate, '#MM / #yyyy'));
		
		formatValue($("#extra"), totals.extra.toString());
		formatValue($("#extra-month"), totals.extraMonth.toString());
		
		if(rowData == undefined)
			return;
		
		formatValue($row.find('.total, .excedente'), rowData.excedente);
	}
	
	function formatValue($target, value) {
		var isNegative = (typeof value == 'string') ? value.indexOf('-') > -1 : value < 0; 
		
		var fn = isNegative ? 'addClass' : 'removeClass';
		$target[fn]('negative-hours');
	}
	
	function settings(){
		var settings = dao.loadSettings();
		$("#total-work").val(settings.totalWork).click(saveSettings);
		$("#lunch-time").val(settings.lunchTime).click(saveSettings);
	}
	
	function openLightbox(id){
		var $elm = $(id); 
		$elm.fadeIn().css('z-index', lightboxIndex ++);
		
		var l = ($(window).width() - $elm.width()) / 2,
			t = ($(window).height() - $elm.height()) / 2;
		
		$elm.css({top: t+ 'px', left: l + 'px'});
	}
	
	function lightbox(){
		
		$('.open-lightbox').click(function(e){
			e.preventDefault();
			openLightbox($(this).attr('href'));
		});
		
		$('.lightbox .close').click(function(e){
			e.preventDefault();
			lightboxIndex --;
			$(this).closest('.lightbox').fadeOut().css('z-index', 'auto');
		});
	}
	
	function saveSettings(e, holidays){
		dao.saveSettings({
			'totalWork': $("#total-work").val(),
			'lunchTime': $("#lunch-time").val(),
			'holidays': holidays || hrs.ui.holidays.getHolidays()
		});

		buildMonth();
	}
	
	function monthInformation(){
		$("#prev-month").click(function(){
			currentDate.setMonth( currentDate.getMonth() - 1);
			buildMonth();
		});
		
		$("#next-month").click(function(){
			currentDate.setMonth( currentDate.getMonth() + 1);
			buildMonth();
		});
	}
	
	function saveImportedData(file){
		var fr = new FileReader();
        fr.onload = function(e){
        	var content = e.target.result;
    		dao.importData(content);
    		buildMonth();
        };
        
        fr.readAsText(file, 'iso-8859-1');
	}
	
	function importExport(){

		$("#export-data").click(function(e){
			var data = dao.exportData();
			location.href = "data:text/json;charset=iso-8859-1;filename*=UTF-8%E2%88%9A.txt;base64," + window.btoa(data) ;
		});
		
		$("#import-data").click(function(e){
			$("#inputfile-import-data").click();
		});
		
		$('#proced-import').click(function(){
			saveImportedData($("#confirm-import")[0].file);
		});
		
		$("#inputfile-import-data").change(function(e){
			var files = e.target.files;
			
			if(files.length == 0) return;
			$("#confirm-import")[0].file = files[0];
			$("#inputfile-import-data").val('');
			openLightbox("#confirm-import");
		});
	}

	
	function holidays(){
		hrs.ui.holidays.init({ $elem: $("#holidays-list"), 
							   holidays: dao.getHolidays(),
							   callback: function(holidays){
								   saveSettings(null, holidays);
							   }});
	}

	return public;
})(jQuery, hrs.helpers, hrs.dao);