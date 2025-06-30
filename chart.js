const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  layout: { background: { color: '#111' }, textColor: '#DDD' },
  grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
  timeScale: { timeVisible: true, secondsVisible: false },
  crosshair: { mode: 1 },
});

const candles = chart.addCandlestickSeries({
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderUpColor: '#26a69a',
  borderDownColor: '#ef5350',
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
});

const spread50 = chart.addLineSeries({ color: 'white', lineWidth: 2 });
const spread100 = chart.addLineSeries({ color: 'gold', lineWidth: 2 });
const spread200 = chart.addLineSeries({ color: 'pink', lineWidth: 2 });

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

    const spreadVals = [];
    const spreadMA50 = [];
    const spreadMA100 = [];
    const spreadMA200 = [];

    const candleMap = {};

    rows.forEach((row, i) => {
      const cells = row.split(',');
      const timestamp = new Date(cells[tsIndex]);
      const time = Math.floor(timestamp.getTime() / 1000);
      const bucket = Math.floor(time / 300) * 300;
      const price = parseFloat(cells[priceIndex]);
      const spread = parseFloat(cells[spreadIndex]);

      // Build 5-minute candles
      if (!candleMap[bucket]) {
        candleMap[bucket] = { time: bucket, open: price, high: price, low: price, close: price };
      } else {
        candleMap[bucket].high = Math.max(candleMap[bucket].high, price);
        candleMap[bucket].low = Math.min(candleMap[bucket].low, price);
        candleMap[bucket].close = price;
      }

      // Store spread values for MAs
      spreadVals.push({ time, value: spread });

      // Calculate EMAs
      if (spreadVals.length >= 50) {
        const avg50 = spreadVals.slice(-50).reduce((a, b) => a + b.value, 0) / 50;
        spreadMA50.push({ time, value: avg50 });
      }
      if (spreadVals.length >= 100) {
        const avg100 = spreadVals.slice(-100).reduce((a, b) => a + b.value, 0) / 100;
        spreadMA100.push({ time, value: avg100 });
      }
      if (spreadVals.length >= 200) {
        const avg200 = spreadVals.slice(-200).reduce((a, b) => a + b.value, 0) / 200;
        spreadMA200.push({ time, value: avg200 });
      }
    });

    const candleData = Object.values(candleMap);
    candles.setData(candleData);
    spread50.setData(spreadMA50);
    spread100.setData(spreadMA100);
    spread200.setData(spreadMA200);

    chart.timeScale().fitContent();
    chart.timeScale().scrollToPosition(0, false);
  })
  .catch(err => {
    console.error('Chart load error:', err);
    alert('Error loading data from CSV. Check console.');
  });
