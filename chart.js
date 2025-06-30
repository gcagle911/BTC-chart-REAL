const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  layout: { background: { color: '#111' }, textColor: '#DDD' },
  grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
  timeScale: { timeVisible: true },
  crosshair: { mode: 1 },
});

const candles = chart.addCandlestickSeries();
const spreadMA = chart.addLineSeries({ color: 'orange', lineWidth: 2 });

// ✅ REAL CSV URL
const csvUrl = 'https://btc-logger-trxi.onrender.com/data.csv';

fetch(csvUrl)
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return res.text();
  })
  .then(text => {
    const rows = text.trim().split('\n');
    const headers = rows.shift().split(',');

    const tsIndex = headers.indexOf('timestamp');
    const priceIndex = headers.indexOf('price');
    const spreadIndex = headers.indexOf('spread');

    const candleData = [];
    const maData = [];

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].split(',');
      const time = Math.floor(new Date(cells[tsIndex]).getTime() / 1000);
      const price = parseFloat(cells[priceIndex]);

      candleData.push({
        time,
        open: price,
        high: price,
        low: price,
        close: price,
      });

      if (i >= 9) {
        const avg = rows
          .slice(i - 9, i + 1)
          .map(r => parseFloat(r.split(',')[spreadIndex]))
          .reduce((a, b) => a + b, 0) / 10;

        maData.push({ time, value: avg });
      }
    }

    candles.setData(candleData);
    spreadMA.setData(maData);
  })
  .catch(err => {
    console.error('Chart load error:', err);
    alert('Error loading data from CSV. Check console.');
  });
