(function(Trends) {

    var jsonToArray = function json2array (json){
        var result = [];
        var keys = Object.keys(json);
        keys.forEach(function(key){
            result.push(json[key]);
        });
        return result;
    };

    Trends.Utils = {
      jsonToArray: jsonToArray
    };

}(window.Trends));