const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  layout: { background: { color: '#111' }, textColor: '#DDD' },
  grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
  timeScale: { timeVisible: true, secondsVisible: false },
  width: window.innerWidth,
  height: window.innerHeight * 0.7, // Main chart top 70%
  crosshair: { mode: 1 },
});

// Sub-panel for Z-score (bottom 30%)
const zChart = LightweightCharts.createChart(document.body.appendChild(document.createElement('div')), {
  layout: { background: { color: '#111' }, textColor: '#DDD' },
  grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
  timeScale: { visible: false },
  width: window.innerWidth,
  height: window.innerHeight * 0.3,
});
zChart.timeScale().setVisibleLogicalRange(chart.timeScale().getVisibleLogicalRange());

const candles = chart.addCandlestickSeries({
  upColor: '#0f0',
  downColor: '#f00',
  borderVisible: false,
  wickUpColor: '#0f0',
  wickDownColor: '#f00',
});

const sma50 = chart.addLineSeries({ color: 'white', lineWidth: 1 });
const sma100 = chart.addLineSeries({ color: 'gold', lineWidth: 1 });
const sma200 = chart.addLineSeries({ color: 'pink', lineWidth: 1 });
const zScoreLine = zChart.addLineSeries({ color: '#0ff', lineWidth: 2 });

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

    const candleMap = {};
    const spreadArr = [];

    rows.forEach(row => {
      const cells = row.split(',');
      const timeMs = new Date(cells[tsIndex]).getTime();
      const price = parseFloat(cells[priceIndex]);
      const spread = parseFloat(cells[spreadIndex]);
      const time = Math.floor(timeMs / 1000);
      const bucket = Math.floor(time / 300) * 300; // 5-minute bucket

      // Candlestick data by 5-min bucket
      if (!candleMap[bucket]) {
        candleMap[bucket] = { time: bucket, open: price, high: price, low: price, close: price };
      } else {
        candleMap[bucket].high = Math.max(candleMap[bucket].high, price);
        candleMap[bucket].low = Math.min(candleMap[bucket].low, price);
        candleMap[bucket].close = price;
      }

      spreadArr.push({ time, value: spread });
    });

    const candleData = Object.values(candleMap).sort((a, b) => a.time - b.time);
    candles.setData(candleData);

    // Simple Moving Averages
    function calcSMA(data, len) {
      return data.map((d, i) => {
        if (i < len - 1) return null;
        const slice = data.slice(i - len + 1, i + 1);
        const avg = slice.reduce((sum, x) => sum + x.value, 0) / len;
        return { time: d.time, value: avg };
      }).filter(Boolean);
    }

    sma50.setData(calcSMA(spreadArr, 50));
    sma100.setData(calcSMA(spreadArr, 100));
    sma200.setData(calcSMA(spreadArr, 200));

    // Z-score of spread
    const zScoreData = spreadArr.map((d, i) => {
      const window = spreadArr.slice(Math.max(0, i - 50), i + 1);
      const values = window.map(x => x.value);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
      return { time: d.time, value: std === 0 ? 0 : (d.value - mean) / std };
    });

    zScoreLine.setData(zScoreData);
  })
  .catch(err => {
    console.error('Chart load error:', err);
    alert('Error loading data from CSV. Check console.');
  });
