// Demo report data for testing the Report page UI
export const DEMO_REPORT = {
  ticker: 'DEMO',
  company_name: 'Uranium Energy Corp',
  analysis_date: '2026-03-09',
  user_name: 'Kerry Grinkmeyer',
  input_price: 13.56,
  input_shares: 2300,
  input_portfolio_pct: 2.3,
  report_json: {
    company: {
      name: 'Uranium Energy Corp',
      ticker: 'UEC',
      exchange: 'NYSE',
      description: 'Uranium Energy Corp is a U.S.-based uranium mining and exploration company focused on low-cost, environmentally friendly in-situ recovery (ISR) mining in Texas and Wyoming.',
      sector: 'Energy',
      industry: 'Uranium Mining'
    },
    hero: {
      price: '$13.56',
      priceChangeToday: '+2.34%',
      marketCap: '$5.4B',
      marketCapLabel: 'Mid Cap',
      week52Range: '$4.95 – $9.49',
      week52RangeNote: '+138% YoY',
      recommendation: 'BUY',
      recommendationDetail: 'Accumulate — Strong Secular Tailwind'
    },
    executiveSummary: {
      takeaways: [
        { number: 1, title: 'Nuclear Renaissance Underway', body: 'Global governments are embracing nuclear energy as a critical component of their decarbonization strategies. The US, EU, China, and India have all announced plans to expand nuclear capacity, creating sustained demand for uranium fuel that far outstrips current supply.' },
        { number: 2, title: 'Best-Positioned US Uranium Producer', body: 'UEC owns the largest permitted, pre-operational ISR uranium mining portfolio in the United States. With Hub & Spoke processing infrastructure already built, the company can ramp production faster and cheaper than any domestic competitor.' },
        { number: 3, title: 'BUY — Meets 100% ROI Goal Under Base Case', body: 'With a base-case projection of $28 by January 2029 (106% ROI from $13.56), UEC exceeds our 100% ROI-in-3-years target. The stock is positioned to benefit from rising uranium prices, US energy security policy, and growing institutional interest.' }
      ]
    },
    quantitative: {
      healthGrades: {
        profitability: { grade: 'C', detail: 'Transitioning from exploration to production; margins improving as mining ramps' },
        liquidity: { grade: 'A', detail: 'Current ratio 12.8x, $185M cash, minimal near-term obligations' },
        solvency: { grade: 'A', detail: 'Debt/Equity 3.2%, virtually debt-free balance sheet' },
        efficiency: { grade: 'B', detail: 'Lean workforce of ~140 employees; revenue per employee improving' }
      },
      ownership: {
        institutions: '52.8%',
        public: '44.1%',
        insiders: '3.1%',
        commentary: 'Strong institutional ownership at 52.8% signals Wall Street confidence. Notable holders include BlackRock, Vanguard, and Sprott Asset Management (a uranium specialist). Insider ownership at 3.1% is modest but CEO Amir Adnani has been a consistent buyer.'
      },
      shortInterest: {
        sharesShort: '18.2M',
        shortPercentFloat: '5.4%',
        shortRatio: '3.1 days',
        priorMonth: '17.8M ↑',
        commentary: 'Short interest is moderate at 5.4% of float. The slight increase from prior month suggests some hedging activity, but this is not at squeeze-risk levels. Days to cover at 3.1 is manageable.'
      },
      balanceSheet: {
        items: [
          { label: 'Total Cash', value: '$185M', detail: '$0.47/share' },
          { label: 'Physical Uranium', value: '$320M', detail: '4.1M lbs at ~$78/lb' },
          { label: 'Total Debt', value: '$18M', detail: 'D/E: 3.2%' },
          { label: 'Book Value', value: '$1.48B', detail: '$3.75/share' }
        ],
        commentary: 'UEC has one of the cleanest balance sheets in the uranium sector. The $185M cash position plus $320M in physical uranium inventory provides significant financial flexibility. The near-zero debt gives management optionality for acquisitions or operational ramp-up.'
      }
    },
    keyRatios: {
      rows: [
        { metric: 'P/E (Trailing)', current: 'N/A', prior1: 'N/A', prior2: 'N/A', industryAvg: '15-25x' },
        { metric: 'Price/Book', current: '3.62x', prior1: '2.89x', prior2: '1.95x', industryAvg: '2-4x' },
        { metric: 'Price/Sales', current: '42.1x', prior1: '68.5x', prior2: 'N/A', industryAvg: '8-15x' },
        { metric: 'EV/Revenue', current: '38.7x', prior1: '62.1x', prior2: 'N/A', industryAvg: '10-20x' },
        { metric: 'ROE', current: '1.8%', prior1: '-2.1%', prior2: '-5.4%', industryAvg: '10-20%' },
        { metric: 'Debt/Equity', current: '3.2%', prior1: '4.1%', prior2: '5.8%', industryAvg: '20-40%' },
        { metric: 'Gross Margin', current: '45.2%', prior1: 'N/A', prior2: 'N/A', industryAvg: '40-55%' }
      ],
      commentary: 'Valuation Context: UEC trades at elevated multiples on a P/S basis (42.1x) because it is in the early stages of production ramp. The declining trend in EV/Revenue (from 62.1x to 38.7x) reflects improving revenue. P/B at 3.62x is reasonable for a company with significant physical uranium inventory and permitted mining assets.'
    },
    growth: {
      ruleOf40Score: '85+',
      ruleOf40Max: '40',
      ruleOf40Commentary: 'Exceptional pass. Revenue CAGR of ~80% combined with improving EPS trajectory gives a combined score well above 40.',
      metrics: [
        { label: 'Q4 2025 Revenue (YoY Growth)', value: '+210%' },
        { label: 'Full Year 2025 Revenue', value: '$128M' },
        { label: '2026 Revenue Guidance', value: '$300-400M' },
        { label: 'Gross Margin', value: '45.2%' },
        { label: 'Uranium Price (Spot)', value: '$82/lb' },
        { label: 'Diluted EPS (TTM)', value: '$0.04' }
      ],
      commentary: 'Growth Analysis: UEC is transitioning from exploration to production at the perfect time. Revenue grew 210% in Q4 as initial mining operations began generating cash. The 2026 guidance of $300-400M implies continued triple-digit growth. Gross margins at 45.2% are healthy for an ISR miner.'
    },
    marketTAM: {
      title: 'Nuclear Energy — The Clean Baseload Power Revolution',
      totalTAM: '$40B+ Annual Uranium Market by 2030',
      segments: [
        { name: 'Nuclear Fuel Supply', size: '$25B+', description: 'Primary uranium for existing and new reactors worldwide' },
        { name: 'US Domestic Production', size: '$5B+', description: 'Growing demand for US-origin uranium under energy security policies' },
        { name: 'Physical Uranium Investment', size: '$8B+', description: 'Sprott, Yellow Cake, and other funds accumulating inventory' },
        { name: 'SMR & Advanced Reactors', size: '$3B+', description: 'Small modular reactors creating new demand stream by 2030' }
      ],
      commentary: 'Market Position: UEC is the largest pure-play US uranium producer with the most advanced ISR mining portfolio. The company is uniquely positioned to benefit from the US government push for domestic uranium supply, where bipartisan legislation is creating mandates for American-origin nuclear fuel.'
