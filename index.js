jQuery(function ($) {

var colors = {
        Bonds: '#44aaaa',
        Frumin: '#00aa00',
        Mara: '#0000aa',
        Silverman: '#aa0000'
    },
    map = L.map('map');
L.tileLayer(
    'http://{s}.tile.cloudmade.com/{key}/{style}/256/{z}/{x}/{y}.png',
    {
        key: '0c1c82bc050546ed93950f730c5a9366',
        style: 998,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18
    }
).addTo(map);

$.ajax({
    url: 'dcision13.json',
    dataType: 'json',
    success: function (data) {
        var layerOptions = {},
            layers = {},
            layer;
        layerOptions.onEachFeature = function (feature, layer) {
            layer.bindPopup(getPopupHtml(feature));
        };
        layerOptions.style = function (feature) {
            var voteList = feature.properties.votes,
                winner = getWinner(voteList),
                total = getTotal(voteList),
                majority = voteList[winner] / total > 0.5;
            return {
                fillColor: colors[winner],
                fillOpacity: majority ? 0.8 : 0.6,
                weight: 1,
                color: 'white'
            };
        };
        layer = L.geoJson(data, layerOptions).addTo(map);
        map.fitBounds(layer.getBounds());
        layers['Precinct winners'] = layer;
        $.each(_.keys(colors), function (i, candidate) {
            layerOptions.style = function (feature) {
                var voteList = feature.properties.votes,
                    total = getTotal(voteList);
                return {
                    fillColor: getGray(voteList[candidate] / total),
                    fillOpacity: 1,
                    weight: 1,
                    color: 'white'
                };
            };
            layers[candidate + ' support'] = L.geoJson(data, layerOptions);
        });
        L.control.layers(null, layers).addTo(map);
    }
});

function getGray(fraction) {
    var hex = _.str.sprintf('%02x', Math.round(255 - 255 * fraction));
    return '#' + _.str.repeat(hex, 3);
}

function getWinner(voteList) {
    var winner;
    $.each(voteList, function (candidate, votes) {
        if (!winner || votes > voteList[winner]) {
            winner = candidate;
        }
    });
    return winner;
}

function getTotal(voteList) {
    return _.reduce(_.values(voteList), function(memo, num){ return memo + num; }, 0);
}

function getPopupHtml(feature) {
    var id = feature.id,
        voteList = _.clone(feature.properties.votes),
        winner = getWinner(voteList),
        total = getTotal(voteList),
        candidates = _.keys(voteList).sort(),
        precinctNumber = id.replace('pct', ''),
        html = '<h4>Precinct ' + precinctNumber +
            ' (Ward ' + feature.properties.ward + ')</h4>';
    html += '<table class="votes">';
    candidates = _.without(candidates, 'Write-in');
    candidates.push('Write-in', 'TOTAL');
    voteList['TOTAL'] = total;
    $.each(candidates, function (i, candidate) {
        var votes = voteList[candidate],
            percent = _.str.sprintf('%.1f', 100 * votes / total);
        if (candidate == 'Write-in') {
            candidate = '<i>' + candidate + '</i>';
        }
        html += (candidate == winner) ? '<tr class="winner">' : '<tr>';
        html += '<td>' + candidate  + '</td><td class="right">' +
            votes + '</td><td class="right">' + percent + '%</td></tr>';
    });
    html += '</table>';
    return html;
}

});
