import type { Subtest } from "@/lib/ucat-lessons";

// Quantitative Reasoning. Every data set and question is written for this site.

const SHOP = [
  { kind: "p" as const, text: "A garden centre's spring price list." },
  { kind: "table" as const, head: ["Item", "Price", "Notes"], rows: [
    ["Compost, 40-litre bag", "£6.50", "3 bags for £15"],
    ["Seed tray", "£2.40", "—"],
    ["Bedding plants, tray of 12", "£9.00", "20% off on Saturdays"],
    ["Delivery", "£8.00", "Free on orders over £50"],
  ] },
];

const CLINIC = [
  { kind: "p" as const, text: "Patients seen at a walk-in clinic over two years." },
  { kind: "table" as const, head: ["Quarter", "2024", "2025"], rows: [
    ["Jan–Mar", "1,200", "1,500"],
    ["Apr–Jun", "1,000", "1,100"],
    ["Jul–Sep", "800", "1,000"],
    ["Oct–Dec", "1,000", "1,400"],
  ] },
];

export const QR: Subtest = {
  key: "qr",
  name: "Quantitative Reasoning",
  intro: "Numbers from tables, charts and short scenarios: percentages, ratios, rates, units and areas, all at about GCSE level. The maths is rarely hard; the clock is. About 43 seconds a question.",
  questions: 36,
  minutes: 26,
  lessons: [
    {
      slug: "how-it-works",
      title: "How Quantitative Reasoning works",
      summary: "The format, the on-screen calculator, and the three questions to ask before you calculate anything.",
      minutes: 8,
      sections: [
        {
          heading: "The format",
          blocks: [
            { kind: "p", text: "36 questions in 26 minutes. Most come in sets of four sharing one table or chart; a few stand alone. Each has five options. There is no negative marking, so never leave one blank." },
            { kind: "p", text: "You get a basic on-screen calculator: the four operations, square root, percentage, memory. Practise with a basic calculator — or the one in the official practice tests — so the keyboard shortcuts are second nature." },
          ],
        },
        {
          heading: "Three questions before you calculate",
          blocks: [
            { kind: "list", ordered: true, items: [
              "Do I need a calculation at all? Some answers can be read straight off the data.",
              "Will the numbers work in my head? 10%, halves, doubles and simple fractions are faster than typing.",
              "Can I eliminate options? A rough estimate often leaves only one answer in the right range.",
            ] },
            { kind: "tip", text: "Think of the calculator as costing time: each use is a token you spend. Spend tokens on the awkward numbers, not on 25% of 80." },
          ],
        },
        {
          heading: "Pace",
          blocks: [
            { kind: "p", text: "Read the data's headings, units and footnotes once, then go to the question. If a question needs several steps and you are not sure of the method within 15 seconds, guess, flag and move on — the next question may take ten seconds." },
          ],
        },
      ],
      terms: [
        { term: "Data set", definition: "The table, chart or text a group of questions shares." },
        { term: "Estimate", definition: "Rounding numbers to get an approximate answer fast, often enough to choose an option." },
        { term: "Flag", definition: "Mark a question to return to from the review screen." },
      ],
      examples: [],
      practice: [
        {
          kind: "mcq", id: "qr-hw-p1",
          prompt: "Which is the quickest way to find 15% of £240?",
          options: ["Type 240 × 15 ÷ 100", "10% is £24, 5% is £12, so £36", "Divide 240 by 15", "Type 240 × 0.85", "Work out 1% and multiply by 15 on the calculator"], answer: 1,
          explanation: "Splitting 15% into 10% + 5% is two mental steps and avoids the calculator. Dividing by 15 and multiplying by 0.85 give the wrong quantity.",
        },
      ],
    },
    {
      slug: "percentages",
      title: "Percentages and percentage change",
      summary: "Percentages of totals, increases and decreases, reverse percentages, and the difference between absolute and relative change.",
      minutes: 14,
      sections: [
        {
          heading: "The core formulas",
          blocks: [
            { kind: "table", head: ["To find", "Calculate"], rows: [
              ["A percentage of the total", "part ÷ total × 100"],
              ["Percentage change", "(new − original) ÷ original × 100"],
              ["A value after a % increase", "original × (1 + rate), e.g. × 1.2 for 20%"],
              ["A value after a % decrease", "original × (1 − rate), e.g. × 0.85 for 15%"],
              ["The original, before a change (reverse %)", "new ÷ (1 ± rate)"],
            ] },
            { kind: "tip", text: "Percentage change always divides by the original value — the 'from' figure — never by the new one." },
          ],
        },
        {
          heading: "Absolute versus relative",
          blocks: [
            { kind: "p", text: "An absolute change is the raw difference (up 300 patients). A relative change is that difference as a share of the original (up 25%). A small group can have the largest relative change and the smallest absolute one — read which one the question asks for." },
          ],
        },
        {
          heading: "Fractions to know by heart",
          blocks: [
            { kind: "table", head: ["Fraction", "Percentage"], rows: [
              ["1/2", "50%"], ["1/3", "33.3%"], ["1/4", "25%"], ["1/5", "20%"], ["1/6", "16.7%"], ["1/8", "12.5%"], ["1/10", "10%"], ["1/20", "5%"],
            ] },
          ],
        },
      ],
      terms: [
        { term: "Percentage point", definition: "The difference between two percentages: 20% to 25% is up 5 percentage points, but up 25% in relative terms." },
        { term: "Multiplier", definition: "The number you multiply by for a change: 1.08 for +8%, 0.7 for −30%." },
        { term: "Reverse percentage", definition: "Finding the value before a percentage change." },
      ],
      examples: [
        {
          kind: "mcq", id: "qr-pc-e1", stimulus: CLINIC,
          prompt: "By what percentage did the number of patients in Oct–Dec rise from 2024 to 2025?",
          options: ["28.6%", "30%", "40%", "400%", "14%"], answer: 2,
          explanation: "(1,400 − 1,000) ÷ 1,000 × 100 = 40%. Dividing by the new value (400 ÷ 1,400) gives the trap answer 28.6%.",
        },
        {
          kind: "mcq", id: "qr-pc-e2",
          stimulus: [{ kind: "p", text: "A jacket costs £68 in a sale that takes 15% off the normal price." }],
          prompt: "What is the normal price?",
          options: ["£57.80", "£78.20", "£80.00", "£83.00", "£85.00"], answer: 2,
          explanation: "£68 is 85% of the normal price: 68 ÷ 0.85 = £80. Adding 15% to £68 (£78.20) is the classic slip.",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "qr-pc-p1", stimulus: CLINIC,
          prompt: "What percentage of the clinic's 2025 patients were seen in Jan–Mar?",
          options: ["25%", "28.0%", "30.0%", "33.3%", "36.6%"], answer: 2,
          explanation: "2025 total: 1,500 + 1,100 + 1,000 + 1,400 = 5,000. 1,500 ÷ 5,000 = 30%.",
        },
        {
          kind: "mcq", id: "qr-pc-p2", stimulus: CLINIC,
          prompt: "Which quarter had the largest percentage increase from 2024 to 2025?",
          options: ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec", "Can't tell"], answer: 3,
          explanation: "Jan–Mar +25%, Apr–Jun +10%, Jul–Sep +25%, Oct–Dec +40%. Oct–Dec also had the largest absolute increase (400).",
        },
        {
          kind: "mcq", id: "qr-pc-p3", stimulus: CLINIC,
          prompt: "The clinic expects 2026 patient numbers to be 8% higher than 2025. How many patients does it expect in 2026?",
          options: ["4,600", "5,080", "5,400", "5,800", "6,000"], answer: 2,
          explanation: "5,000 × 1.08 = 5,400.",
        },
      ],
    },
    {
      slug: "ratios-and-proportions",
      title: "Ratios, proportions and averages",
      summary: "Sharing in a ratio, the part:part versus part:whole distinction, and weighted means.",
      minutes: 12,
      sections: [
        {
          heading: "Ratio and proportion",
          blocks: [
            { kind: "p", text: "A ratio compares parts with each other: 3 boys to 2 girls is 3:2. A proportion compares a part with the whole: boys are 3/5 of the class. Questions switch between the two — be sure which you have." },
            { kind: "list", ordered: true, items: [
              "Add the ratio's parts to get the number of shares (3 + 2 = 5).",
              "Divide the total by the number of shares to get one share.",
              "Multiply one share by each part.",
            ] },
          ],
        },
        {
          heading: "Averages that need weighting",
          blocks: [
            { kind: "p", text: "The mean of two groups' means is only right if the groups are the same size. Otherwise, rebuild the totals: total = mean × count for each group, add the totals, divide by the overall count." },
            { kind: "tip", text: "If one person joins and the mean changes, the new person's value is new total − old total." },
          ],
        },
      ],
      terms: [
        { term: "Ratio", definition: "A comparison of parts: part to part." },
        { term: "Proportion", definition: "A part as a fraction of the whole." },
        { term: "Weighted mean", definition: "A mean that accounts for groups of different sizes." },
      ],
      examples: [
        {
          kind: "mcq", id: "qr-rp-e1",
          stimulus: [{ kind: "p", text: "A charity's £1,800 donation is split between three projects in the ratio 4:3:2." }],
          prompt: "How much more does the largest project get than the smallest?",
          options: ["£200", "£400", "£600", "£800", "£900"], answer: 1,
          explanation: "9 shares, so one share is £200. Largest 4 × 200 = £800, smallest 2 × 200 = £400. Difference £400.",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "qr-rp-p1",
          stimulus: [{ kind: "p", text: "In a ward of 28 patients, the ratio of men to women is 3:4." }],
          prompt: "What proportion of the patients are men?",
          options: ["3/4", "3/7", "4/7", "12", "1/3"], answer: 1,
          explanation: "3 out of every 7 patients are men: 3/7 (12 people). 3/4 is the ratio of men to women, not a proportion of the whole; 12 is a count, not a proportion.",
        },
        {
          kind: "mcq", id: "qr-rp-p2",
          stimulus: [{ kind: "p", text: "Class A's 20 students scored a mean of 70%. Class B's 30 students scored a mean of 60%." }],
          prompt: "What was the mean score of all 50 students?",
          options: ["62%", "64%", "65%", "66%", "68%"], answer: 1,
          explanation: "Totals: 20 × 70 = 1,400 and 30 × 60 = 1,800. 3,200 ÷ 50 = 64%. The simple average of the two means, 65%, ignores the different class sizes.",
        },
        {
          kind: "mcq", id: "qr-rp-p3",
          stimulus: [{ kind: "p", text: "Four friends' mean height is 170 cm. A fifth friend joins and the mean becomes 172 cm." }],
          prompt: "How tall is the fifth friend?",
          options: ["172 cm", "174 cm", "176 cm", "180 cm", "182 cm"], answer: 3,
          explanation: "Old total 4 × 170 = 680. New total 5 × 172 = 860. Fifth friend: 860 − 680 = 180 cm.",
        },
      ],
    },
    {
      slug: "rates-and-units",
      title: "Speed, rates and units",
      summary: "Distance, speed and time; average speed with stops; exchange rates, per-100 g labels, and converting between units.",
      minutes: 13,
      sections: [
        {
          heading: "Speed, distance, time",
          blocks: [
            { kind: "p", text: "Speed = distance ÷ time. Rearranged: distance = speed × time, time = distance ÷ speed. Convert minutes to hours before mixing them with km/h: 45 minutes is 0.75 hours, 20 minutes is 1/3 of an hour." },
            { kind: "tip", text: "Average speed is total distance ÷ total time — including stops. It is not the average of the speeds." },
          ],
        },
        {
          heading: "Rates and conversions",
          blocks: [
            { kind: "list", items: [
              "Exchange rates: if £1 = €1.15, multiply pounds by 1.15 to get euros and divide euros by 1.15 to get pounds. Check the answer's size makes sense.",
              "Per 100 g: a figure per 100 g is the percentage by weight — 12 g of sugar per 100 g is 12% sugar.",
              "Units: 1 km = 1,000 m; 1 m = 100 cm; 1 litre = 1,000 ml = 1,000 cm³; 1 kg = 1,000 g; 1 hour = 60 minutes.",
              "Area units square the factor: 1 m² = 10,000 cm². Volume units cube it: 1 m³ = 1,000,000 cm³.",
            ] },
          ],
        },
        {
          heading: "Whole items versus fractions",
          blocks: [
            { kind: "p", text: "When you buy things you round up to whole items — 7.2 boxes means buying 8. When you use something (an ingredient, fuel) fractions are fine. And check any multi-buy offers before multiplying the single price." },
          ],
        },
      ],
      terms: [
        { term: "Rate", definition: "One quantity per unit of another: km per hour, £ per kg, ml per minute." },
        { term: "Exchange rate", definition: "How much of one currency one unit of another buys." },
        { term: "Average speed", definition: "Total distance divided by total time taken." },
      ],
      examples: [
        {
          kind: "mcq", id: "qr-ru-e1",
          stimulus: [{ kind: "p", text: "A delivery driver travels 90 km at 60 km/h, stops for 30 minutes, then travels a further 60 km at 40 km/h." }],
          prompt: "What is the driver's average speed for the whole journey, including the stop?",
          options: ["37.5 km/h", "42.9 km/h", "45 km/h", "50 km/h", "52.5 km/h"], answer: 1,
          explanation: "Time: 90 ÷ 60 = 1.5 h, stop 0.5 h, 60 ÷ 40 = 1.5 h — 3.5 h in all. Distance 150 km. 150 ÷ 3.5 = 42.9 km/h. 50 km/h is the average of the two speeds — wrong.",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "qr-ru-p1", stimulus: SHOP,
          prompt: "Kim buys 7 bags of compost. What does she pay, before delivery?",
          options: ["£30.00", "£36.50", "£40.00", "£42.50", "£45.50"], answer: 1,
          explanation: "Two lots of 3 for £15 cover 6 bags (£30); the seventh costs £6.50. £36.50 in all. 7 × £6.50 = £45.50 ignores the offer.",
        },
        {
          kind: "mcq", id: "qr-ru-p2",
          stimulus: [{ kind: "p", text: "A drip delivers 1.5 litres of fluid over 6 hours at a constant rate." }],
          prompt: "What is the rate in millilitres per minute?",
          options: ["0.25 ml/min", "2.5 ml/min", "4.17 ml/min", "25 ml/min", "250 ml/min"], answer: 2,
          explanation: "1,500 ml ÷ 360 minutes = 4.17 ml/min. (250 ml is the rate per hour.)",
        },
        {
          kind: "mcq", id: "qr-ru-p3",
          stimulus: [{ kind: "p", text: "A holiday costs €1,380. The exchange rate is £1 = €1.15." }],
          prompt: "What does the holiday cost in pounds?",
          options: ["£1,000", "£1,173", "£1,200", "£1,380", "£1,587"], answer: 2,
          explanation: "Euros to pounds: divide. 1,380 ÷ 1.15 = £1,200. Multiplying gives £1,587, which is bigger than the euro figure — impossible when a pound is worth more than a euro.",
        },
      ],
    },
    {
      slug: "area-and-volume",
      title: "Area, volume and scale",
      summary: "Splitting awkward shapes, circles with π as 3, and what happens to area and volume when lengths scale.",
      minutes: 12,
      sections: [
        {
          heading: "Formulas you need",
          blocks: [
            { kind: "table", head: ["Shape", "Area or volume"], rows: [
              ["Rectangle", "length × width"],
              ["Triangle", "½ × base × height"],
              ["Trapezium", "½ × (a + b) × height"],
              ["Circle", "π × r² (circumference 2 × π × r)"],
              ["Cuboid", "length × width × height"],
              ["Cylinder", "π × r² × height"],
            ] },
            { kind: "tip", text: "Questions often say to take π as 3. Use the value given — answers are built around it." },
          ],
        },
        {
          heading: "Awkward shapes",
          blocks: [
            { kind: "p", text: "Break an L-shape or a room with an alcove into rectangles and triangles, find each area, then add. Or find the big rectangle and subtract the missing piece — whichever needs fewer steps." },
          ],
        },
        {
          heading: "Scaling",
          blocks: [
            { kind: "p", text: "If every length is multiplied by k, area is multiplied by k² and volume by k³. Double the sides of a box and it holds eight times as much." },
          ],
        },
      ],
      terms: [
        { term: "Radius", definition: "Distance from the centre of a circle to its edge; half the diameter." },
        { term: "Scale factor", definition: "The number every length is multiplied by." },
        { term: "Similar shapes", definition: "Shapes with the same proportions, one an enlargement of the other." },
      ],
      examples: [
        {
          kind: "mcq", id: "qr-av-e1",
          stimulus: [{ kind: "p", text: "An L-shaped room is a 6 m × 5 m rectangle with a 2 m × 3 m rectangle cut from one corner. Flooring costs £22 per m², sold by the whole m²." }],
          prompt: "What does it cost to floor the room?",
          options: ["£396", "£528", "£660", "£792", "£528.50"], answer: 1,
          explanation: "30 − 6 = 24 m². 24 × £22 = £528.",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "qr-av-p1",
          stimulus: [{ kind: "p", text: "A circular pond has a diameter of 4 m. Take π as 3." }],
          prompt: "What is the pond's surface area?",
          options: ["6 m²", "12 m²", "24 m²", "48 m²", "16 m²"], answer: 1,
          explanation: "Radius 2 m. 3 × 2² = 12 m². Using the diameter instead of the radius gives 48.",
        },
        {
          kind: "mcq", id: "qr-av-p2",
          stimulus: [{ kind: "p", text: "A cylindrical water tank is 2 m tall with a radius of 0.5 m. Take π as 3. 1 m³ = 1,000 litres." }],
          prompt: "How many litres does the tank hold when full?",
          options: ["150", "750", "1,500", "3,000", "6,000"], answer: 2,
          explanation: "3 × 0.5² × 2 = 3 × 0.25 × 2 = 1.5 m³ = 1,500 litres.",
        },
        {
          kind: "mcq", id: "qr-av-p3",
          stimulus: [{ kind: "p", text: "A model of a building is made at a scale where every length is 1/50 of the real one. The model's floor area is 120 cm²." }],
          prompt: "What is the real floor area?",
          options: ["6,000 cm²", "0.6 m²", "30 m²", "60 m²", "300 m²"], answer: 2,
          explanation: "Area scales by 50² = 2,500. 120 × 2,500 = 300,000 cm² = 30 m² (10,000 cm² to a m²).",
        },
      ],
    },
    {
      slug: "charts-and-tables",
      title: "Reading charts and tables",
      summary: "Getting the right figure out of a table or chart fast — and the questions where 'Can't tell' is the honest answer.",
      minutes: 10,
      sections: [
        {
          heading: "Read the frame first",
          blocks: [
            { kind: "list", items: [
              "Title and units: thousands? per cent? per 100 g?",
              "Axes: does the y-axis start at zero? A cut-off axis exaggerates differences.",
              "Footnotes and keys: totals, exclusions, prices before VAT.",
              "Stacked bars show parts of a whole — read the segment's length, not where it ends.",
            ] },
          ],
        },
        {
          heading: "Multi-step questions",
          blocks: [
            { kind: "p", text: "Write the steps down before keying anything: what figure do I need, from where, and what do I do with it? Keep intermediate answers in the calculator's memory instead of retyping them." },
            { kind: "tip", text: "Some questions offer 'Can't tell'. Choose it only when the data really cannot give the answer — not because the calculation is long." },
          ],
        },
      ],
      terms: [
        { term: "Stacked bar", definition: "A bar split into segments that add up to a total." },
        { term: "Truncated axis", definition: "An axis that does not start at zero." },
        { term: "Can't tell", definition: "The answer when the data provided cannot produce the figure asked for." },
      ],
      examples: [
        {
          kind: "mcq", id: "qr-ct-e1", stimulus: SHOP,
          prompt: "On a Saturday, Tom buys 4 trays of bedding plants and 3 seed trays and has them delivered. What does he pay?",
          options: ["£36.00", "£42.56", "£43.20", "£44.00", "£51.20"], answer: 3,
          explanation: "Plants: 4 × £9 = £36, less 20% = £28.80. Seed trays: 3 × £2.40 = £7.20. Goods £36.00 — not over £50, so delivery is £8. Total £44.00. £36.00 forgets delivery; £42.56 takes 20% off the seed trays too; £51.20 misses the Saturday discount.",
        },
      ],
      practice: [
        {
          kind: "mcq", id: "qr-ct-p1", stimulus: CLINIC,
          prompt: "What was the mean number of patients per quarter in 2024?",
          options: ["900", "950", "1,000", "1,050", "1,250"], answer: 2,
          explanation: "2024 total: 1,200 + 1,000 + 800 + 1,000 = 4,000. 4,000 ÷ 4 = 1,000.",
        },
        {
          kind: "mcq", id: "qr-ct-p2", stimulus: CLINIC,
          prompt: "How many of the 2025 Jan–Mar patients were under 18?",
          options: ["150", "300", "375", "500", "Can't tell"], answer: 4,
          explanation: "The table gives no breakdown by age. There is nothing to calculate from.",
        },
      ],
    },
  ],
};
