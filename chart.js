const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  layout: { background: { color: '#111' }, textColor: '#DDD' },
  grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
  timeScale: { timeVisible: true, secondsVisible: false },
  crosshair: { mode: 1 },
});

const candleSeries = chart.addCandlestickSeries();
const spreadLine = chart.addLineSeries({ color: 'orange', lineWidth: 2 });

const csvUrl = 'https://your-render-app.onrender.com/data.csv'; // <-- replace this

fetch(csvUrl)
  .then(res => res.text())
  .then(csv => {
    const rows = csv.trim().split('\n').slice(1); // skip header
    const candles = [];
    const spreadMA = [];

    for (let i = 0; i < rows.length; i++) {
      const [ts, price, bid, ask, spread] = rows[i].split(',');
      const time = Math.floor(new Date(ts).getTime() / 1000);

      candles.push({
        time: time,
        open: parseFloat(price),
        high: parseFloat(price),
        low: parseFloat(price),
        close: parseFloat(price),
      });

      if (i >= 9) {
        const avg = rows.slice(i - 9, i + 1)
          .map(r => parseFloat(r.split(',')[4]))
          .reduce((a, b) => a + b, 0) / 10;

        spreadMA.push({ time: time, value: avg });
      }
    }

    candleSeries.setData(candles);
    spreadLine.setData(spreadMA);
  });
