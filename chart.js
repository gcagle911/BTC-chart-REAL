const chart = LightweightCharts.createChart(document.getElementById('top'), {
  layout: { background: { color: '#111' }, textColor: '#DDD' },
  grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
  timeScale: { timeVisible: true },
  crosshair: { mode: 1 },
});

const candles = chart.addCandlestickSeries({
  upColor: '#0f0',
  downColor: '#f00',
  borderVisible: false,
  wickUpColor: '#0f0',
  wickDownColor: '#f00',
});

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

    const candleMap = {};

    rows.forEach(row => {
      const cells = row.split(',');
      const timeMs = new Date(cells[tsIndex]).getTime();
      const price = parseFloat(cells[priceIndex]);
      const time = Math.floor(timeMs / 1000);
      const bucket = Math.floor(time / 300) * 300; // 5-minute bucket

      if (!candleMap[bucket]) {
        candleMap[bucket] = { time: bucket, open: price, high: price, low: price, close: price };
      } else {
        candleMap[bucket].high = Math.max(candleMap[bucket].high, price);
        candleMap[bucket].low = Math.min(candleMap[bucket].low, price);
        candleMap[bucket].close = price;
      }
    });

    const candleData = Object.values(candleMap).sort((a, b) => a.time - b.time);
    candles.setData(candleData);
  })
  .catch(err => {
    console.error('Chart load error:', err);
    alert('Error loading data from CSV. Check console.');
  });
