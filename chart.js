const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  layout: { background: { color: '#111' }, textColor: '#DDD' },
  grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
  timeScale: { timeVisible: true, secondsVisible: false },
  crosshair: { mode: 1 },
  rightPriceScale: { scaleMargins: { top: 0.2, bottom: 0.25 } }
});

const volumePane = LightweightCharts.createChart(document.getElementById('volume'), {
  layout: { background: { color: '#111' }, textColor: '#DDD' },
  grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
  timeScale: { visible: false },
  height: 100
});

// Candles
const candles = chart.addCandlestickSeries({
  upColor: '#0f0',
  downColor: '#f00',
  borderVisible: false,
  wickUpColor: '#0f0',
  wickDownColor: '#f00'
});

// Spread MAs
const spreadMA50 = chart.addLineSeries({ color: 'white', lineWidth: 1 });
const spreadMA100 = chart.addLineSeries({ color: 'gold', lineWidth: 1 });
const spreadMA200 = chart.addLineSeries({ color: 'pink', lineWidth: 1 });

// Z-score (bottom panel)
const zScoreSeries = volumePane.addLineSeries({ color: 'cyan', lineWidth: 1 });

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
    const spreadList = [];
    const ma50 = [];
    const ma100 = [];
    const ma200 = [];
    const zScores = [];

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].split(',');
      const time = Math.floor(new Date(cells[tsIndex]).getTime() / 1000);
      const price = parseFloat(cells[priceIndex]);
      const spread = parseFloat(cells[spreadIndex]);

      candleData.push({ time, open: price, high: price, low: price, close: price });
      spreadList.push({ time, value: spread });

      const sma = (period) => {
        if (i >= period - 1) {
          const slice = rows.slice(i - period + 1, i + 1);
          const avg = slice
            .map(r => parseFloat(r.split(',')[spreadIndex]))
            .reduce((a, b) => a + b, 0) / period;
          return { time, value: avg };
        }
      };

      const zWindow = 50;
      if (i >= zWindow - 1) {
        const values = rows.slice(i - zWindow + 1, i + 1).map(r => parseFloat(r.split(',')[spreadIndex]));
        const mean = values.reduce((a, b) => a + b, 0) / zWindow;
        const std = Math.sqrt(values.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / zWindow);
        const z = std === 0 ? 0 : (spread - mean) / std;
        zScores.push({ time, value: z });
      }

      const sma50 = sma(50);
      const sma100 = sma(100);
      const sma200 = sma(200);
      if (sma50) ma50.push(sma50);
      if (sma100) ma100.push(sma100);
      if (sma200) ma200.push(sma200);
    }

    candles.setData(candleData);
    spreadMA50.setData(ma50);
    spreadMA100.setData(ma100);
    spreadMA200.setData(ma200);
    zScoreSeries.setData(zScores);
  })
  .catch(err => {
    console.error('Chart load error:', err);
    alert('Error loading data from CSV. Check console.');
  });
