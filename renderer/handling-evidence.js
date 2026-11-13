// Curated research records, transcribed from docs/research/slotcar-handling-library-2026-11-13.html.
// Reports are observations, not calibrated handling coefficients or independent trials.
(function(root){'use strict';const data={
  "date": "2026-11-13",
  "records": [
    {
      "id": "R1",
      "brand": "NSR",
      "car": "NSR Mosler MT900R",
      "configuration": "NSR Mosler MT900R Xamoth, 17 March 2009 Modified R1 · S1",
      "layout": "Not reported",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Rear sliding; front ballast worsened it on uneven Scalextric Sport. Setup/change: Retained ballast under rear axle; amount unreported. Traction magnet: Not explicitly stated for this owner",
      "sources": [
        "S1"
      ]
    },
    {
      "id": "R2",
      "brand": "NSR",
      "car": "NSR Mosler MT900R",
      "configuration": "NSR Mosler MT900R mouche, racing/light body Modified R2 · S1",
      "layout": "AW",
      "tyres": "Fly Racing on Ninco Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Owner reports successful handling. Setup/change: 2–3 g near front axle; freely moving guide. Traction magnet: Not explicitly stated",
      "sources": [
        "S1"
      ]
    },
    {
      "id": "R3",
      "brand": "NSR",
      "car": "NSR Porsche 917",
      "configuration": "NSR Porsche 917 johnny; exact variant unreported Magnet removed / prepared R3 · S1",
      "layout": "Not reported",
      "tyres": "Original; sanded Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Satisfied with handling on Carrera. Setup/change: No ballast. Traction magnet: Removed",
      "sources": [
        "S1"
      ]
    },
    {
      "id": "R4",
      "brand": "NSR",
      "car": "NSR Ford Mk IV",
      "configuration": "NSR Ford Mk IV Harley Magnet removed / prepared R4 · S1",
      "layout": "Not reported",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Runs well on Scalextric Sport. Setup/change: No ballast. Traction magnet: Removed",
      "sources": [
        "S1"
      ]
    },
    {
      "id": "R5",
      "brand": "NSR",
      "car": "NSR Porsche 997 GT3",
      "configuration": "NSR Porsche 997 GT3 Club builds Modified R5 · S2",
      "layout": "AW — inferred",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Some owners find it demanding; another calls it agile. Setup/change: Club preparation; opinions conflict. Traction magnet: Not separately established",
      "sources": [
        "S2"
      ]
    },
    {
      "id": "R6",
      "brand": "NSR",
      "car": "NSR BMW Z4 GT3",
      "configuration": "NSR BMW Z4 GT3 Club builds Modified R6 · S2",
      "layout": "AW — inferred",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Reported harder to make fast; limited owner experience. Setup/change: Club preparation. Traction magnet: Not separately established",
      "sources": [
        "S2"
      ]
    },
    {
      "id": "R7",
      "brand": "NSR",
      "car": "NSR Audi R8 LMS",
      "configuration": "NSR Audi R8 LMS Club builds Modified R7 · S2",
      "layout": "AW — inferred",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Stable and forgiving once tuned. Setup/change: Light cockpit; blue chassis reported beneficial. Traction magnet: Not separately established",
      "sources": [
        "S2"
      ]
    },
    {
      "id": "R8",
      "brand": "NSR",
      "car": "NSR ASV GT3",
      "configuration": "NSR ASV GT3 Club builds Modified R8 · S2",
      "layout": "AW — inferred",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Forgiving, stable; can feel slower than its times. Setup/change: Blue chassis improved control for one owner. Traction magnet: Not separately established",
      "sources": [
        "S2"
      ]
    },
    {
      "id": "R9",
      "brand": "NSR",
      "car": "NSR Corvette C6.R",
      "configuration": "NSR Corvette C6.R Club builds Modified R9 · S2",
      "layout": "AW — inferred",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Forgiving and fast; recommended to beginners. Setup/change: Blue chassis improved stability for one owner. Traction magnet: Not separately established",
      "sources": [
        "S2"
      ]
    },
    {
      "id": "R10",
      "brand": "NSR",
      "car": "NSR Corvette C7.R",
      "configuration": "NSR Corvette C7.R Club builds Modified R10 · S2",
      "layout": "AW — inferred",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Body stabiliser screws improved stability; another owner struggled. Setup/change: Reply identifies possible front-wheel/body interference. Traction magnet: Not separately established",
      "sources": [
        "S2"
      ]
    },
    {
      "id": "R11",
      "brand": "Slot.it",
      "car": "Slot.it Mercedes 190E DTM",
      "configuration": "Slot.it Mercedes 190E DTM CA44a Prepared then modified R11 · S3",
      "layout": "IL",
      "tyres": "C1 → trued/oiled F22 Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Less braking stopped sideways lurching; tyre change improved grip and typical laps (~5.9 → ~5.4 s). Setup/change: Pod loosening later gave no significant benefit. Traction magnet: Not explicitly removed Measurement and evidence notes Before/after; braking and tyres changed sequentially.",
      "sources": [
        "S3"
      ]
    },
    {
      "id": "R12",
      "brand": "Slot.it",
      "car": "Slot.it Mercedes 190E DTM",
      "configuration": "Slot.it Mercedes 190E DTM 2019 release Modified R12 · S4",
      "layout": "IL",
      "tyres": "1171 N22; glued/trued Width: Not reported",
      "mass": "Not reported Reference specification: 70 g; tested mass unknown.",
      "wheelbase": "Not reported Reference specification: 83 mm",
      "report": "Ballasted cars matched the unweighted Opel in this tester's comparison. Setup/change: About 8–9 g added; tyres exchanged between cars. Traction magnet: Wood testing; removal not explicitly documented",
      "sources": [
        "S4"
      ]
    },
    {
      "id": "R13",
      "brand": "Slot.it",
      "car": "Slot.it Alfa Romeo 155 DTM",
      "configuration": "Slot.it Alfa Romeo 155 DTM CA40/CA45; not all 155 generations Modified R13 · S4",
      "layout": "IL",
      "tyres": "1171 N22; glued/trued Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Similar pace to Mercedes; ballast closed gap to Opel. Setup/change: About 8–9 g added. Traction magnet: Wood testing; removal not explicitly documented",
      "sources": [
        "S4"
      ]
    },
    {
      "id": "R14",
      "brand": "Slot.it",
      "car": "Slot.it Opel Calibra DTM",
      "configuration": "Slot.it Opel Calibra DTM Exact livery unreported Modified R14 · S4",
      "layout": "IL",
      "tyres": "1171 N22; glued/trued Width: Not reported",
      "mass": "Not reported Reference specification: 68 g; tested mass unknown.",
      "wheelbase": "Not reported Reference specification: 80.5 mm",
      "report": "Unweighted benchmark for ballasted Mercedes/Alfas. Setup/change: No added ballast. Traction magnet: Wood testing; removal not explicitly documented",
      "sources": [
        "S4"
      ]
    },
    {
      "id": "R15",
      "brand": "Scaleauto",
      "car": "Scaleauto Porsche 991",
      "configuration": "Scaleauto Porsche 991 Racing Series Modified R15 · S5",
      "layout": "AW",
      "tyres": "SC-4728 soft; trued to ~20 mm OD Width: 10 mm",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Stable; no exit shudder under load. Best 6.32 s. Setup/change: 2 g Blu-Tack; softer braid, axle adjustment, chassis flattened. Traction magnet: Removed Measurement and evidence notes Nominal tyre size, not measured contact patch. Prepared result; ballast location not explicitly stated.",
      "sources": [
        "S5"
      ]
    },
    {
      "id": "R16",
      "brand": "Scaleauto",
      "car": "Scaleauto Porsche 991",
      "configuration": "Scaleauto Porsche 991 Home Series Modified R16 · S6",
      "layout": "SW",
      "tyres": "Slot.it 1172 N22; glued/trued Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Smooth, easy to drive; 6.8 s. Setup/change: ~6 g behind guide; axle adjustment, soft braid, repaired/braced chassis. Traction magnet: Removed Measurement and evidence notes Additional 2–3 g was proposed, not tested.",
      "sources": [
        "S6"
      ]
    },
    {
      "id": "R17",
      "brand": "Scaleauto",
      "car": "Scaleauto Porsche 963",
      "configuration": "Scaleauto Porsche 963 Early kit; FastenBelts Modified R17 · S7",
      "layout": "Not verified",
      "tyres": "Original → Sideways GT3 Width: Not reported",
      "mass": "85 g",
      "wheelbase": "Not reported",
      "report": "Better grip with replacement tyres; still cumbersome in tight sections. Setup/change: Other assembly issues remained. Traction magnet: Unknown Measurement and evidence notes Owner reports 85 g unpainted; exact weighing stage unspecified.",
      "sources": [
        "S7"
      ]
    },
    {
      "id": "R18",
      "brand": "Scaleauto",
      "car": "Scaleauto Porsche 963",
      "configuration": "Scaleauto Porsche 963 Early kit; MxBoy Modified R18 · S7",
      "layout": "Not verified",
      "tyres": "NSR 5231 UltraGrip Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Controllable rear drift; stable fast sequences; deslots when pushed over technical/crest sections. Setup/change: Front tyre roundness and body interference investigated; no confirmed fix here. Traction magnet: Unknown",
      "sources": [
        "S7"
      ]
    },
    {
      "id": "R19",
      "brand": "Slot.it",
      "car": "Slot.it Toyota GR010",
      "configuration": "Slot.it Toyota GR010 White kit; Mbmx Modified R19 · S8",
      "layout": "Not verified",
      "tyres": "Scaleauto AS25 20×10.5 Width: 10.5 mm",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Rear sliding and exit hopping remained; ~6.5 s. Setup/change: Flat-6 RS, carbon 1 mm-offset pod, flattened chassis, small front ballast. Traction magnet: Unknown Measurement and evidence notes Guide to rear axle: 114 mm (approximate; not wheelbase). Nominal tyre size.",
      "sources": [
        "S8"
      ]
    },
    {
      "id": "R20",
      "brand": "NSR",
      "car": "NSR Formula 22/26",
      "configuration": "NSR Formula 22/26 Formula 22 club builds, 2024 Modified R20 · S9 + S10",
      "layout": "IL — manufacturer reference",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Quick, throttle-sensitive; several deslots/crashes. Setup/change: Different chassis hardnesses; results do not isolate their effect. Traction magnet: Not established from this race report",
      "sources": [
        "S9",
        "S10"
      ]
    },
    {
      "id": "R21",
      "brand": "NSR",
      "car": "NSR Mosler MT900R",
      "configuration": "NSR Mosler MT900R Xavex 2006 Modified R21 · S11",
      "layout": "SW",
      "tyres": "NSR UltraGrip rear; Slot.it low-profile fronts Width: Not reported",
      "mass": "70 g Body: 17 g",
      "wheelbase": "Not reported",
      "report": "Strong grip; rear tyre preparation and conditioning helped. Setup/change: Body/pod float; motor/bushings secured. Traction magnet: Removed Measurement and evidence notes Review measurement; not a modern-generation stock specification.",
      "sources": [
        "S11"
      ]
    },
    {
      "id": "R22",
      "brand": "Slot.it",
      "car": "Slot.it Matra MS670B",
      "configuration": "Slot.it Matra MS670B CA27A, 1974 Le Mans version Modified R22 · S12",
      "layout": "SW",
      "tyres": "Paul Gage XPG20115 Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "More planted than comparison GT40/McLaren. Setup/change: Common tyres, axle-height adjustment and float; no ballast. Traction magnet: Non-magnet test",
      "sources": [
        "S12"
      ]
    },
    {
      "id": "R23",
      "brand": "Slot.it",
      "car": "Slot.it Ford GT40",
      "configuration": "Slot.it Ford GT40 Exact mark/livery not verified Modified R23 · S12",
      "layout": "SW — classic-series context",
      "tyres": "Paul Gage XPG20115 Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Smooth but some corner chatter; behind Matra. Setup/change: Same basic preparation; no ballast. Traction magnet: Non-magnet test",
      "sources": [
        "S12"
      ]
    },
    {
      "id": "R24",
      "brand": "Scaleauto",
      "car": "Scaleauto De Tomaso Pantera",
      "configuration": "Scaleauto De Tomaso Pantera SC-6034, RT3 Stock baseline + modifications R24 · S13",
      "layout": "SW",
      "tyres": "Original rear rubber Width: Not reported",
      "mass": "73.8 g Body: 17.8 g",
      "wheelbase": "Not reported",
      "report": "Strong magnet grip; front lift. Smooth without magnet, but reviewer wanted better tyres. Setup/change: Front ballast or central button magnet countered lift. Traction magnet: Stock bar / alternative button / removed Measurement and evidence notes Review measurement; post-modification mass unknown.",
      "sources": [
        "S13"
      ]
    },
    {
      "id": "R25",
      "brand": "Scaleauto",
      "car": "Scaleauto BMW Z4 GT3",
      "configuration": "Scaleauto BMW Z4 GT3 SC-6028, RT3 Stock baseline + modifications R25 · S14",
      "layout": "SW",
      "tyres": "Original rear rubber Width: Not reported",
      "mass": "76.9 g Body: 19.3 g",
      "wheelbase": "Not reported",
      "report": "Stock magnet caused trouble on inclines; weaker magnet allowed mild slides. Setup/change: No-magnet front ballast helped guide retention. Traction magnet: Stock bar / 5 mm button / removed Measurement and evidence notes Review measurement; post-modification mass unknown.",
      "sources": [
        "S14"
      ]
    },
    {
      "id": "R26",
      "brand": "Scaleauto",
      "car": "Scaleauto Spyker C8 GT2-R",
      "configuration": "Scaleauto Spyker C8 GT2-R SC-6026, RT3 Stock baseline + modifications R26 · S15",
      "layout": "SW",
      "tyres": "Original rear rubber Width: Not reported",
      "mass": "77.6 g Body: 16.2 g",
      "wheelbase": "Not reported",
      "report": "Front lifted on humps with rear magnet; central button gave enjoyable mild sliding. Setup/change: Changed magnet; adjusted axle height and float. Traction magnet: Stock bar / 5 mm button / removed Measurement and evidence notes Review measurement; post-modification mass unknown.",
      "sources": [
        "S15"
      ]
    },
    {
      "id": "R27",
      "brand": "NSR",
      "car": "NSR Audi R8 LMS",
      "configuration": "NSR Audi R8 LMS giese54 build Modified R27 · S16",
      "layout": "Not verified",
      "tyres": "BRM 20×11, Shore 22 Width: 11 mm",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Ran well after combined changes. Setup/change: Spanish 19k motor, ballast, wider front track, fixed guide arm. Traction magnet: Traction magnet unknown; owner calls motor non-magnetic Measurement and evidence notes Nominal tyre size.",
      "sources": [
        "S16"
      ]
    },
    {
      "id": "R28",
      "brand": "Slot.it",
      "car": "Slot.it Nissan R390 GT1",
      "configuration": "Slot.it Nissan R390 GT1 Short-tail SW conversion Modified R28 · S16",
      "layout": "SW",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Usable but rear-heavy in owner's assessment. Setup/change: MB Slot motor; substantial front ballast; smaller front wheels. Traction magnet: Unknown",
      "sources": [
        "S16"
      ]
    },
    {
      "id": "R29",
      "brand": "Slot.it",
      "car": "Slot.it Nissan R390 GT1",
      "configuration": "Slot.it Nissan R390 GT1 Long-tail AW conversion Modified R29 · S16",
      "layout": "AW",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Owner's most balanced of three different R390 builds. Setup/change: Flat-6 R; newer front-axle design. Traction magnet: Unknown",
      "sources": [
        "S16"
      ]
    },
    {
      "id": "R30",
      "brand": "Slot.it",
      "car": "Slot.it Porsche 962C",
      "configuration": "Slot.it Porsche 962C Older Blaupunkt body / rebuilt chassis Modified R30 · S17",
      "layout": "Not verified",
      "tyres": "Sideways Carrera compound Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Forgiving but initially sluggish; preferred 26-tooth over 28-tooth crown. Setup/change: Suspended replacement pod, NSR King, magnesium wheels. Traction magnet: Unknown Measurement and evidence notes Gearing preference; no isolated suspension or weight test.",
      "sources": [
        "S17"
      ]
    },
    {
      "id": "R31",
      "brand": "Slot.it",
      "car": "Slot.it Nissan R390 GT1",
      "configuration": "Slot.it Nissan R390 GT1 2018 AW release Modified R31 · S18",
      "layout": "AW",
      "tyres": "Quick Slicks silicone Width: Not reported",
      "mass": "84 g Body: 23 g",
      "wheelbase": "Not reported",
      "report": "Good grip on reviewer's painted surface after preparation. Setup/change: Axle adjustment and play correction; different tyres. Traction magnet: Unknown Measurement and evidence notes Review measurement before final tyre/setup changes.",
      "sources": [
        "S18"
      ]
    },
    {
      "id": "R32",
      "brand": "Slot.it",
      "car": "Slot.it Nissan R390 GT1",
      "configuration": "Slot.it Nissan R390 GT1 Longtail, 2009 test Magnet removed / prepared R32 · S19",
      "layout": "IL",
      "tyres": "Original; sanded Width: Not reported",
      "mass": "77 g",
      "wheelbase": "83.3 mm",
      "report": "Calm through tight and sweeping bends without ballast. Setup/change: Lubrication and body/pod float. Traction magnet: Removed Measurement and evidence notes Magazine test table; weighing stage unspecified. Magazine test table.",
      "sources": [
        "S19"
      ]
    },
    {
      "id": "R33",
      "brand": "NSR",
      "car": "NSR Porsche 908/3",
      "configuration": "NSR Porsche 908/3 2024 reviewed release Stock assumed R33 · S20",
      "layout": "Not verified",
      "tyres": "Original Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Reviewer places it among his fastest classics on small home track. Setup/change: Guide swap only contemplated; not a tested improvement. Traction magnet: Unknown",
      "sources": [
        "S20"
      ]
    },
    {
      "id": "R34",
      "brand": "Policar",
      "car": "Policar BRM P153",
      "configuration": "Policar BRM P153 JC Giese · 2024 Modified R34 · S21",
      "layout": "IL compound gearbox (inferred; confirm specimen)",
      "tyres": "Sideways Pro Speed Soft 20×11 Width: 11 mm nominal",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Initially worse than the owner's other F1s; after preparation, predictable and similarly quick. Setup/change: Alloy rear wheels, thinner wires/braids, unspecified ballast, freed body movement and drivetrain run-in. Traction magnet: Not reported Measurement and evidence notes Combined intervention; no isolated ballast effect.",
      "sources": [
        "S21"
      ]
    },
    {
      "id": "R35",
      "brand": "Policar",
      "car": "Policar Lotus 72",
      "configuration": "Policar Lotus 72 JPS · JC Giese · 2023 Modified R35 · S22",
      "layout": "IL compound gearbox (inferred; confirm specimen)",
      "tyres": "Sideways Pro Speed S 20×11 Width: 11 mm nominal",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Smooth and pleasant, with mild rear sliding; pace comparable to owner's other Policar F1s. Setup/change: Replaced slipping plastic rear wheel with alloys; thinner wires and braids. Traction magnet: Not reported Measurement and evidence notes Owner attributes sliding to rear overhang, without testing that explanation.",
      "sources": [
        "S22"
      ]
    },
    {
      "id": "R36",
      "brand": "Policar",
      "car": "Policar Ferrari 126 C2",
      "configuration": "Policar Ferrari 126 C2 Belgian GP 1982 version · 2023 report Modified R36 · S23",
      "layout": "IL compound gearbox (inferred; confirm specimen)",
      "tyres": "Slot.it G25 Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Good grip and strong race-night performance; some wheel lift, especially on lane 2. Setup/change: Thinner wires/braids, loosened pod, freed binding front axle. Usual 20×11 tyres did not fit these wheels. Traction magnet: Not reported Measurement and evidence notes Front-axle height check proposed, not a demonstrated cure.",
      "sources": [
        "S23"
      ]
    },
    {
      "id": "R37",
      "brand": "Black Arrow",
      "car": "Black Arrow Aston Martin DBR9",
      "configuration": "Black Arrow Aston Martin DBR9 BACM01C · Manic · 2013 Adjusted / tyre swap R37 · S24",
      "layout": "IL",
      "tyres": "Stock R1 → Slot.it rubber, compound unspecified Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Rear body initially scraped; after ride-height adjustment, smooth. Stock tyres slid excessively on Carrera; replacement rubber improved grip and reported lap time by about 1 s. Setup/change: Body/ride-height adjustment and rear tyres; no ballast added. Traction magnet: None",
      "sources": [
        "S24"
      ]
    },
    {
      "id": "R38",
      "brand": "Black Arrow",
      "car": "Black Arrow Ferrari 458 GT3",
      "configuration": "Black Arrow Ferrari 458 GT3 countbasie64 · Ninco · 2020 Modified R38 · S25",
      "layout": "Not reported",
      "tyres": "Sideways, compound unspecified Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Owner finds it balanced and competitive with GT3 rivals; preferred its performance to the Murciélago. Setup/change: Replaced original tyres, considered too hard for this track. Traction magnet: Not reported Measurement and evidence notes Qualitative collection comparison; drivetrain and magnetic conditions not documented.",
      "sources": [
        "S25"
      ]
    },
    {
      "id": "R39",
      "brand": "Black Arrow",
      "car": "Black Arrow Lamborghini Murciélago",
      "configuration": "Black Arrow Lamborghini Murciélago countbasie64 · Ninco · 2020 Modified R39 · S25",
      "layout": "Not reported",
      "tyres": "Sideways, compound unspecified Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Included in a well-balanced, competitive collection, but owner's Ferrari 458s performed better. Setup/change: Replacement rear tyres; no model-specific before/after measurements. Traction magnet: Not reported",
      "sources": [
        "S25"
      ]
    },
    {
      "id": "R40",
      "brand": "Avantslot",
      "car": "Avantslot Peugeot 908 HDi",
      "configuration": "Avantslot Peugeot 908 HDi Black test-car edition · parryana · 2008 Magnet removed / adjusted R40 · S26",
      "layout": "Not reported",
      "tyres": "Stock; raised centre reported Width: Not reported",
      "mass": "76 g",
      "wheelbase": "Not reported",
      "report": "Stable until pushed; rear sliding improved with body-screw loosening, but exit sliding remained. Best reported lap 4.08 s. Setup/change: Removed magnet, loosened body screws, lubricated. Tyre truing still needed. Traction magnet: Removed Measurement and evidence notes Mass weighing stage unspecified. Reviewer says 11 mm-wide tyres would not fit; this is not the fitted tyre width.",
      "sources": [
        "S26"
      ]
    },
    {
      "id": "R41",
      "brand": "Avantslot",
      "car": "Avantslot Pescarolo Sport",
      "configuration": "Avantslot Pescarolo Sport JASEN63 · 2008 Prepared; details unspecified R41 · S27",
      "layout": "Not reported",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Owner reports stable, rapid cornering and beating their prepared Toyota's times. Setup/change: Adjustments and preparation not itemised. Traction magnet: Not reported Measurement and evidence notes No times, matched setup or dimensions; weak evidence for causes.",
      "sources": [
        "S27"
      ]
    },
    {
      "id": "R42",
      "brand": "Fly",
      "car": "Fly Porsche 917K",
      "configuration": "Fly Porsche 917K FlySlot 2012 #24 · revised chassis Modified R42 · S28",
      "layout": "IL",
      "tyres": "Stock rears reseated; front tyres removed for test Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Barely completed laps initially due to rubbing and strong magnets. After corrections, enjoyable and progressively quicker over about 50 laps. Setup/change: Removed magnets, moved rubbing rear wheel, reseated rear tyres, removed rubbing fronts. Traction magnet: Removed Measurement and evidence notes Earlier SW versions must not be merged with this IL generation.",
      "sources": [
        "S28"
      ]
    },
    {
      "id": "R43",
      "brand": "Fly",
      "car": "Fly Porsche 917 LH",
      "configuration": "Fly Porsche 917 LH FlySlot Alpha #18 · 2013 Digital conversion / modified R43 · S29",
      "layout": "IL",
      "tyres": "Stock Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Smooth and controllable; also ran without magnet, with no reported fishtailing. Reviewer preferred the central magnet position. Setup/change: Slot.it CH26 guide, Ninco braids, lubrication/run-in and digital chip; tested rear/central/no magnet. Traction magnet: Multiple tested configurations Measurement and evidence notes No ballast added. Non-magnet timed test used a milder throttle profile.",
      "sources": [
        "S29"
      ]
    },
    {
      "id": "R44",
      "brand": "MR SlotCar",
      "car": "MR SlotCar Mazda 787B",
      "configuration": "MR SlotCar Mazda 787B jc · black car · Carrera · May 2011 Tyres replaced R44 · S30",
      "layout": "IL",
      "tyres": "Slot.it P6 Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Similar driving feel to the Slot.it Mazda; MR felt less lively and was a few hundredths slower. Setup/change: Both cars fitted with P6 tyres. Traction magnet: Not reported Measurement and evidence notes Author says MR heavier but gives no mass; not a controlled mass experiment.",
      "sources": [
        "S30"
      ]
    },
    {
      "id": "R45",
      "brand": "MR SlotCar",
      "car": "MR SlotCar Mazda 787B",
      "configuration": "MR SlotCar Mazda 787B Fair · Nantes club · July 2011 Club prepared R45 · S30",
      "layout": "IL",
      "tyres": "BRM S102 rear; Slot.it PT15 front Width: Not reported",
      "mass": "80.9 g",
      "wheelbase": "Not reported",
      "report": "Very strong cornering; comfortably competed with Slot.it Group C cars. Formal timed comparison still pending. Setup/change: 22k motor, 9:28 gears, tight body/chassis screws and free pod. Traction magnet: Not reported",
      "sources": [
        "S30"
      ]
    },
    {
      "id": "R46",
      "brand": "MR SlotCar",
      "car": "MR SlotCar Shadow DN4",
      "configuration": "MR SlotCar Shadow DN4 Stargazers65 · C24T · July 2023 Modified R46 · S31",
      "layout": "SW",
      "tyres": "Sideways PS1M-NG 20×11 Width: 11 mm nominal",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Stable and easy to place, but guide scraped the slot bottom. Regular 8.6 s laps; no matched rival test. Setup/change: Removed magnet; soft braids, replacement tyres, pod loosened and lubricated. Traction magnet: Removed Measurement and evidence notes 23k motor and 11:34 gearing retained. Guide trimming/gearing revision were proposed, not verified fixes.",
      "sources": [
        "S31"
      ]
    },
    {
      "id": "R47",
      "brand": "Ninco",
      "car": "Ninco Mosler MT900R",
      "configuration": "Ninco Mosler MT900R LeyJun lightened edition · 2008 Stock → tyre preparation R47 · S32",
      "layout": "AW",
      "tyres": "Stock revised rear tyres, then sanded/cleaned Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Best lap improved from 5.681 s initially to 5.351 s after tyre preparation, then 5.144 s with further running/practice. Setup/change: Rear tyre sanding/cleaning; later gains also include running-in and driver adaptation. Traction magnet: Stock button magnet Measurement and evidence notes 2 g refers to interior weight saving versus older version, not total weight. New motor mounting and tyres also differ.",
      "sources": [
        "S32"
      ]
    },
    {
      "id": "R48",
      "brand": "Ninco",
      "car": "Ninco Mercedes C-Class DTM",
      "configuration": "Ninco Mercedes C-Class DTM Replacement Olifer chassis in build narrative Extensively modified R48 · S33",
      "layout": "AW trial → IL final; other changes concurrent",
      "tyres": "Scaleauto SC-4735 rear; low-profile fronts Width: Not reported",
      "mass": "Not reported Body: Just over 22 g with lightweight interior",
      "wheelbase": "Not reported",
      "report": "AW build bounced/scraped. IL rebuild improved running; excessive body roll caused rubbing. Body supports and front-wheel height adjustment reduced corner snagging and two-wheel lift. Setup/change: New chassis/pod, gearing, suspension, guide shim, body supports and front-axle setting. Traction magnet: Not reported Measurement and evidence notes Fast corners remained demanding. Many changes prevent attributing improvement to layout alone.",
      "sources": [
        "S33"
      ]
    },
    {
      "id": "R49",
      "brand": "Pioneer",
      "car": "Pioneer Mustang 390 GT",
      "configuration": "Pioneer Mustang 390 GT P001 Bullitt · Manic · magnetic test Stock → prepared R49 · S34",
      "layout": "SW",
      "tyres": "Stock → trued rears Width: Not reported",
      "mass": "87 g (listed review specification)",
      "wheelbase": "Not reported",
      "report": "Smooth and quick through technical sections; tyre truing, screw adjustment and running improved pace. Setup/change: Rear tyre truing and body screws loosened. Traction magnet: Stock rear magnet; forward position also tried",
      "sources": [
        "S34"
      ]
    },
    {
      "id": "R50",
      "brand": "Pioneer",
      "car": "Pioneer Mustang 390 GT",
      "configuration": "Pioneer Mustang 390 GT P001 Bullitt · Manic · non-magnet test Modified R50 · S34",
      "layout": "SW",
      "tyres": "Trued stock rears Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Controllable slides; deslots over Carrera humps were resolved after adding less than 5 g at the front. Setup/change: Magnet removed, small front ballast addition. Traction magnet: Removed Measurement and evidence notes Final total mass unknown; 7.61 s best reported lap is track-specific.",
      "sources": [
        "S34"
      ]
    },
    {
      "id": "R51",
      "brand": "Pioneer",
      "car": "Pioneer Mustang notchback",
      "configuration": "Pioneer Mustang notchback 1968 pre-production kit · Reinecke · 2010 Kit assembled / decorated R51 · S35",
      "layout": "Not reported",
      "tyres": "Stock Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Controllable, good braking; tail stepped out under hard driving, with spin-outs rather than rolling at the limit. Setup/change: Assembly/lubrication; 18k Typhoon. Traction magnet: Present Measurement and evidence notes Pre-production sample; chassis layout not established in accessible text.",
      "sources": [
        "S35"
      ]
    },
    {
      "id": "R52",
      "brand": "Pioneer",
      "car": "Pioneer Mustang notchback",
      "configuration": "Pioneer Mustang notchback 1967 pre-production kit · Reinecke · 2010 Kit modified R52 · S35",
      "layout": "Not reported",
      "tyres": "Supplied experimental oversized tyres, unsanded Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Ran well without magnet, slightly behind comparison Scalextrics; comparison cars had ballast and sanded tyres. Setup/change: Magnet omitted and oversized tyres fitted. Traction magnet: None Measurement and evidence notes Additional ballast/tyre sanding suggested for Pioneer but not tested in this report.",
      "sources": [
        "S35"
      ]
    },
    {
      "id": "R53",
      "brand": "Racer Sideways",
      "car": "Racer Sideways Ford Capri Group 5",
      "configuration": "Racer Sideways Ford Capri Group 5 Slottest · multiple chassis trials Extensively modified R53 · S36",
      "layout": "AW (inferred from pods/drivetrain)",
      "tyres": "Scaleauto SC-4735 rear; low-profile front Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Erratic with body/tyre contact and chassis distortion. After relieving interference and changing pod/wheel configuration, handled bumps well. Setup/change: Black chassis, body/chassis clearance corrections, zero-offset pod, 15.8 mm wheels, revised drivetrain. Traction magnet: Not reported Measurement and evidence notes 15.8 mm is wheel diameter, not tyre diameter. This is a fit/assembly case, not a universal Capri handling trait.",
      "sources": [
        "S36"
      ]
    },
    {
      "id": "R54",
      "brand": "Racer Sideways",
      "car": "Racer Sideways Ferrari 512 BB Group 5",
      "configuration": "Racer Sideways Ferrari 512 BB Group 5 Slottest · staged preparation Modified R54 · S37",
      "layout": "AW (inferred from pods/drivetrain)",
      "tyres": "Scaleauto SC-4735 rear; low-profile front Width: Not reported",
      "mass": "Not reported Body: 17.9 g after lightweight interior",
      "wheelbase": "Not reported",
      "report": "Reconstructed standard setup was forgiving; prepared version had strong exit traction and cornering. Setup/change: Flexible chassis, offset pod, motor/gearing/suspension changes, then lightweight interior. Traction magnet: Not reported Measurement and evidence notes Body mass is not total mass; setup and motor changes prevent a pure weight comparison.",
      "sources": [
        "S37"
      ]
    },
    {
      "id": "R55",
      "brand": "Racer Sideways",
      "car": "Racer Sideways Lancia Beta Montecarlo",
      "configuration": "Racer Sideways Lancia Beta Montecarlo Slottest · staged preparation Modified R55 · S38",
      "layout": "AW (inferred from pods/drivetrain)",
      "tyres": "Scaleauto SC-4735 rear; low-profile front Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Nervous and sensitive, with vibration/front lift. Several changes improved response but did not produce an easy, competitive car for this driver. Setup/change: Flexible chassis, Speed 5 motor, suspension, lighter interior and gearing changes. Traction magnet: Removed Measurement and evidence notes Suspected bearing looseness unresolved; track and driver changes confound timing. Short guide span is an explanation proposed by reviewer.",
      "sources": [
        "S38"
      ]
    },
    {
      "id": "R56",
      "brand": "Thunderslot",
      "car": "Thunderslot Lola T70 MkIII",
      "configuration": "Thunderslot Lola T70 MkIII Early release · Harry · 2016 Basic preparation R56 · S39",
      "layout": "SW, approximately 2.5° skew",
      "tyres": "Stock rear rubber; sanding helped contact Width: Not reported",
      "mass": "63 g Body: 17 g",
      "wheelbase": "75 mm",
      "report": "Smooth with manageable power on a small home track; strong stock-tyre grip. Setup/change: Checks/lubrication, rear support bracket fitted; tyre sanding discussed as useful preparation. Traction magnet: None",
      "sources": [
        "S39"
      ]
    },
    {
      "id": "R57",
      "brand": "Thunderslot",
      "car": "Thunderslot Ferrari 350 Can-Am",
      "configuration": "Thunderslot Ferrari 350 Can-Am Slot Magazine 65 · 2024 Stock; adjustment need noted R57 · S40",
      "layout": "SW",
      "tyres": "Stock classic soft rear rubber Width: Not reported",
      "mass": "61 g Body: 13 g including interior",
      "wheelbase": "75 mm",
      "report": "Smooth and controllable on Policar track, similar subjective feel to the tested Lola and McLaren. Setup/change: Front tyre/inner-wing rubbing noted; front-axle setting needed checking. Traction magnet: None",
      "sources": [
        "S40"
      ]
    },
    {
      "id": "R58",
      "brand": "Thunderslot",
      "car": "Thunderslot Lola T70 Spyder",
      "configuration": "Thunderslot Lola T70 Spyder Kit-built comparator · Slot Magazine 65 Kit-built; details incomplete R58 · S40",
      "layout": "SW (shared drivetrain reported)",
      "tyres": "Not reported Width: Not reported",
      "mass": "61 g",
      "wheelbase": "Not reported",
      "report": "Smooth and controllable alongside Ferrari 350 and McLaren M6. Setup/change: Preparation not itemised. Traction magnet: Not explicitly stated for comparator",
      "sources": [
        "S40"
      ]
    },
    {
      "id": "R59",
      "brand": "Thunderslot",
      "car": "Thunderslot McLaren M6",
      "configuration": "Thunderslot McLaren M6 Race-prepared comparator · Slot Magazine 65 Race prepared R59 · S40",
      "layout": "SW (shared drivetrain reported)",
      "tyres": "Thunderslot slicks Width: Not reported",
      "mass": "62 g",
      "wheelbase": "Not reported",
      "report": "Smooth and controllable; very small acceleration advantage over new Ferrari in informal comparison. Setup/change: Run-in and race preparation; no matched stock comparison. Traction magnet: Not explicitly stated for comparator",
      "sources": [
        "S40"
      ]
    },
    {
      "id": "R60",
      "brand": "Thunderslot",
      "car": "Thunderslot McLaren Elva",
      "configuration": "Thunderslot McLaren Elva Stargazers65 · Carrera · 2020 Basic preparation → tyre/float changes R60 · S41",
      "layout": "SW, slightly skewed",
      "tyres": "Stock treaded → TYR005X slicks Width: Not reported",
      "mass": "Not reported Body: 13 g",
      "wheelbase": "Not reported",
      "report": "Stock tyres slid on exits. TYR005X added grip but exposed two-wheel lift; more body/pod freedom reduced it. Setup/change: Front-axle adjustment and run-in first; then tyres and screw adjustments. No ballast. Traction magnet: None Measurement and evidence notes 13.868 → 11.454 s spans tyres, practice and float changes; not an isolated tyre effect.",
      "sources": [
        "S41"
      ]
    },
    {
      "id": "R61",
      "brand": "Thunderslot",
      "car": "Thunderslot McLaren M6",
      "configuration": "Thunderslot McLaren M6 Ric Woods · M6A/B early kit built as M6B · 2018 White kit · completed track test R61 · S42",
      "layout": "SW — inferred",
      "tyres": "Kit tyres; oil-treated Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Smooth and stable on 50-foot painted Carrera; over 300 laps without deslotting, eventually beating his Lola reference. Setup/change: Front ballast before testing; pinion clearance corrected; pod/body screws adjusted as tyres bedded. Traction magnet: Not explicitly established for this specimen Measurement and evidence notes Ballast amount and finished mass unknown. No unballasted baseline. Supplied review sample; do not merge with Marc Abbott’s separate preproduction car in the same article.",
      "sources": [
        "S42"
      ]
    },
    {
      "id": "R62",
      "brand": "Thunderslot",
      "car": "Thunderslot McLaren M6",
      "configuration": "Thunderslot McLaren M6 John · M6A · Austin proxy rounds 4–5 · 2020 Race prepared · successive rounds R62 · S44 · S45",
      "layout": "SW — inferred",
      "tyres": "Replacement tyres; compound unspecified Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Improved traction reported in round 4; easy for multiple drivers and still winning in round 5. Setup/change: New tyres before round 4. Traction magnet: Not explicitly established for this specimen Measurement and evidence notes Tyre diameter also changed. This is one continuing car history, not two independent tests.",
      "sources": [
        "S44",
        "S45"
      ]
    },
    {
      "id": "R63",
      "brand": "Thunderslot",
      "car": "Thunderslot Lola T70 MkIII",
      "configuration": "Thunderslot Lola T70 MkIII Russell · Lola coupé; MkIII family inferred · Austin 2020 Race prepared · tyre-work outcome R63 · S44",
      "layout": "SW — inferred",
      "tyres": "Worked on before round 4; details unknown Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Stable and easy for all drivers; second in round 4 without the fastest single lap. Setup/change: Tyre work; exact procedure unreported. Traction magnet: Not explicitly established for this specimen",
      "sources": [
        "S44"
      ]
    },
    {
      "id": "R64",
      "brand": "Thunderslot",
      "car": "Thunderslot Lola T70 Spyder",
      "configuration": "Thunderslot Lola T70 Spyder Ary · Austin proxy rounds 4–5 · 2020 Race prepared · confirmed follow-up R64 · S44 · S45",
      "layout": "SW — inferred",
      "tyres": "Poor-performing set → new set; compound unknown Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Difficult for every driver in round 4; after replacement tyres, second in round 5. Setup/change: Replacement planned in round 4 and confirmed in round 5. Traction magnet: Not explicitly established for this specimen Measurement and evidence notes A useful follow-up, but round-to-round conditions and other changes were not controlled.",
      "sources": [
        "S44",
        "S45"
      ]
    },
    {
      "id": "R65",
      "brand": "Scaleauto",
      "car": "Scaleauto Audi R8 LMS (2015)",
      "configuration": "Scaleauto Audi R8 LMS (2015) Giovanni Russello / GRUNZ · DiSCA · 2018 White kit · digital race build R65 · S46",
      "layout": "AW",
      "tyres": "Sponge rear tyres Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Competitive on the builder’s home track, near a similarly configured Sideways Huracán; no lap figures supplied. Setup/change: Slot.it 0.0-offset pod, Baby Sprinter motor, 14:26 gearing and Oxigen chip; pod modified for pinion clearance. Traction magnet: Not explicitly established for this specimen Measurement and evidence notes A complete preparation package, not a stock test or isolated pod comparison. Distinct from the earlier LMS Ultra body.",
      "sources": [
        "S46"
      ]
    },
    {
      "id": "R66",
      "brand": "Scaleauto",
      "car": "Scaleauto Peugeot 9X8",
      "configuration": "Scaleauto Peugeot 9X8 MxBoy · July 2024 White kit · initial test and follow-up R66 · S47 · S53",
      "layout": "AW — inferred",
      "tyres": "Sideways Medium 22 Shore Width: Not reported",
      "mass": "83 g",
      "wheelbase": "Not reported",
      "report": "Confident entry, moderate drift and responsive direction changes; preferred to this owner’s differently prepared 963. Setup/change: 13:30 gearing, stock motor, widened front spacing and prepared axle support; chassis bridges cut by later test. Traction magnet: Not explicitly established for this specimen Measurement and evidence notes Marshall reading 90 g including mass: reported attraction equivalent 7 g under that test. Not a transferable rail-force measurement. The later comparison still reports the original motor; the proposed NSR swap is not a confirmed outcome.",
      "sources": [
        "S47",
        "S53"
      ]
    },
    {
      "id": "R67",
      "brand": "NSR",
      "car": "NSR Formula 86/89",
      "configuration": "NSR Formula 86/89 LittleBen and LittleTom · painted Test Car White RTRs · April 2020 Repainted RTR · no meaningful tyre-test gain R67 · S48",
      "layout": "IL; King 21",
      "tyres": "Original SuperGrip → NSR 5287 low profile Width: Not reported",
      "mass": "Not reported Body: 11 g painted bodies, rounded",
      "wheelbase": "Not reported",
      "report": "Rollovers/deslots during initial runs; changing tyre profile produced no meaningful lap-time improvement on painted Carrera. Setup/change: Two drivers tested both lanes. Same compound, different profile; front-height adjustment and ballast remained proposals. Traction magnet: Not explicitly established for this specimen Measurement and evidence notes These were assembled white RTRs, not white kits. The 1 g-resolution scale and different reference body do not establish paint mass. Track layout changed before this test: earlier times are not a baseline.",
      "sources": [
        "S48"
      ]
    },
    {
      "id": "R68",
      "brand": "Racer Sideways",
      "car": "Racer Sideways McLaren 720S",
      "configuration": "Racer Sideways McLaren 720S Marsu · preproduction example · 2021 White kit · prototype · club preparation R68 · S49 · S52",
      "layout": "AW — inferred",
      "tyres": "Sideways Medium 20 × 11 Width: 11 mm nominal",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Fastest inner-lane lap, but abrupt breakaway under attack and less consistent individual laps. Setup/change: Shared GT3 preparation; see S52. Traction magnet: Not explicitly established for this specimen Measurement and evidence notes Prototype performance must not be assigned automatically to later retail cars.",
      "sources": [
        "S49",
        "S52"
      ]
    },
    {
      "id": "R69",
      "brand": "Scaleauto",
      "car": "Scaleauto Audi R8 LMS Ultra",
      "configuration": "Scaleauto Audi R8 LMS Ultra Marsu · 2021 White kit · club preparation R69 · S49 · S52",
      "layout": "AW — inferred",
      "tyres": "Sideways Medium 20 × 11 Width: 11 mm nominal",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Agile, occasionally on two wheels; second on best inner lap but eighth over five consecutive laps. Setup/change: Shared GT3 preparation; see S52. Traction magnet: Not explicitly established for this specimen",
      "sources": [
        "S49",
        "S52"
      ]
    },
    {
      "id": "R70",
      "brand": "Racer Sideways",
      "car": "Racer Sideways Lamborghini Huracán",
      "configuration": "Racer Sideways Lamborghini Huracán Marsu · 2021 White kit · club preparation R70 · S49 · S52",
      "layout": "AW — inferred",
      "tyres": "Sideways Medium 20 × 11 Width: 11 mm nominal",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Easy and consistent over consecutive laps; occasional straight-on departures attributed by the driver to the low front. Setup/change: Shared GT3 preparation; see S52. Traction magnet: Not explicitly established for this specimen",
      "sources": [
        "S49",
        "S52"
      ]
    },
    {
      "id": "R71",
      "brand": "Black Arrow",
      "car": "Black Arrow Ferrari 458 GT3",
      "configuration": "Black Arrow Ferrari 458 GT3 LittleBen · first completed Italia Competizione kit · August 2017 White kit · modified build R71 · S50",
      "layout": "AW — inferred",
      "tyres": "NSR 5231 UltraGrip low profile 20.5 × 11 Width: 11 mm nominal",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Builder reports excellent running, nearly matching his track record immediately; qualitative comparison with his tyre-modified Momo RTR. Setup/change: Orange chassis, Lexan interior/windows, CH85 guide, NSR 3023 motor, 13:31 gears and NSR rear axle; standard red springs. Traction magnet: Not explicitly established for this specimen Measurement and evidence notes Carrera with elevation changes. No finished mass or isolated component test. Harder blue springs were proposed, not confirmed tested.",
      "sources": [
        "S50"
      ]
    },
    {
      "id": "R72",
      "brand": "Racer Sideways",
      "car": "Racer Sideways Nissan Skyline Turbo Group 5",
      "configuration": "Racer Sideways Nissan Skyline Turbo Group 5 slotloco · stage A · April 2020 Prepared RTR · baseline for conversion R72 · S51",
      "layout": "AW; Flat-6, 11:28",
      "tyres": "NSR UltraGrip 21 × 12; pre-trued Width: 12 mm nominal",
      "mass": "Just over 80 g before conversion; final stage mass unknown Body: 18 g",
      "wheelbase": "79.5 mm",
      "report": "5.3 s with body; near front-lift limit on small wood track. Setup/change: Rear offset, wheels, tyres and pod spacers already changed; no nose ballast. Traction magnet: Not explicitly established for this specimen Measurement and evidence notes Guide-post-centre to rear axle ≈95 mm. Not a factory-stock baseline.",
      "sources": [
        "S51"
      ]
    },
    {
      "id": "R73",
      "brand": "Racer Sideways",
      "car": "Racer Sideways Nissan Skyline Turbo Group 5",
      "configuration": "Racer Sideways Nissan Skyline Turbo Group 5 slotloco · stage B; same car as R72 · April 2020 Custom conversion · combined changes R73 · S51",
      "layout": "SW; MX16, 11:35",
      "tyres": "NSR UltraGrip; further preparation Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Consistent 5.1–5.2 s assembled; body-screw tightness affected behaviour. Setup/change: SW pod/motor/gearing, 6 g around guide, front tyres, ride height and mounting changes. Traction magnet: Not explicitly established for this specimen Measurement and evidence notes Same car, multiple changes: no isolated motor-layout or ballast effect. Final mass unreported; do not add 6 g to the earlier weight.",
      "sources": [
        "S51"
      ]
    },
    {
      "id": "R74",
      "brand": "Scaleauto",
      "car": "Scaleauto Porsche 963",
      "configuration": "Scaleauto Porsche 963 MxBoy · CCSlot chassis conversion · July 2024 Custom chassis · qualitative gearing follow-up R74 · S53",
      "layout": "Not established for this build",
      "tyres": "Not reported Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Owner reports better control, braking and corner exits after shortening gearing on an already modified chassis. Setup/change: NSR 50,000 RPM motor retained; 13:30 changed to 10:31 in later account (earlier post says 10:30). Chassis cut and front spacing widened. Traction magnet: Not explicitly established for this specimen Measurement and evidence notes Reported ten-lap total is smaller than ten times the reported best lap: timings excluded, not corrected by guessing. Motor, tyres, suspension and magnetic attraction differ between comparison cars. This supports investigating gearing, not recommending a higher-RPM motor.",
      "sources": [
        "S53"
      ]
    },
    {
      "id": "R75",
      "brand": "Slot.it",
      "car": "Slot.it Maserati MC GT3",
      "configuration": "Slot.it Maserati MC GT3 LittleBen · initial preparation · July 2020 Same-car sequence · stage A R75 · S58",
      "layout": "SW",
      "tyres": "Original → Slot.it P6 PT24 Width: Not reported",
      "mass": "72 g at initial weighing Body: 22 g at initial weighing",
      "wheelbase": "Not reported",
      "report": "On Carrera, baseline best lap 6.907 s; after screw/float adjustment 6.809 s; after P6 rear tyres 6.736 s. Setup/change: Body and pod movement adjusted, then rear tyres changed. Traction magnet: Not independently established for this specimen Measurement and evidence notes Sequential best laps, not repeated controlled trials. Excess pod movement allowed the gear to contact the cockpit. Later stages are the same car, not independent evidence.",
      "sources": [
        "S58"
      ]
    },
    {
      "id": "R76",
      "brand": "Slot.it",
      "car": "Slot.it Maserati MC GT3",
      "configuration": "Slot.it Maserati MC GT3 LittleBen · same car as R75 · 14–15 July 2020 Same-car sequence · ballast follow-up R76 · S59",
      "layout": "SW",
      "tyres": "P6 rear; PT05 front Width: Not reported",
      "mass": "Not reported",
      "wheelbase": "Not reported",
      "report": "Removing one 2.5 g pod weight improved the best lap slightly but made driving less stable and more demanding. Owner preferred 5 g ballast with the original 32-tooth gear. Setup/change: Two 2.5 g SP23 pod weights; frontward one retained in lighter test. Earlier preparation also changed front setup, rear wheels, screws and pod freedom. Traction magnet: Not independently established for this specimen Measurement and evidence notes One weight was subsequently restored with a different 31-tooth gear: not a clean A–B–A reversal. Final complete mass and lap distributions are unavailable. Initial 72 g cannot simply be increased by ballast mass after other component changes.",
      "sources": [
        "S59"
      ]
    },
    {
      "id": "R77",
      "brand": "Black Arrow",
      "car": "Black Arrow Lamborghini Murciélago",
      "configuration": "Black Arrow Lamborghini Murciélago Demon Tweeks #37 · Global GT 2025 Prepared proxy car · linked venues R77 · S54 · S55 · S56 · S57",
      "layout": "AW; NSR Shark 21.5k",
      "tyres": "NSR rear; compound unspecified Width: Front 9.4 mm; rear 10 mm",
      "mass": "92.9 g — derived F + R",
      "wheelbase": "Not reported",
      "report": "Class winner at Wirral and Trelawney. At Viking, strong through flowing corners but weaker braking/acceleration through tight corners. Setup/change: Race-prepared Black Arrow chassis; no isolated setup change between these observations established. Traction magnet: Not independently established for this specimen Measurement and evidence notes Sheet reports F 37.7 g / R 55.2 g, clearance 2.2 mm and motor traction 0.78 gf. Fixture and weighing procedure unspecified. Viking lane and driver effects are confounded; fastest driver was on flowing yellow lane.",
      "sources": [
        "S54",
        "S55",
        "S56",
        "S57"
      ]
    },
    {
      "id": "R78",
      "brand": "Scaleauto",
      "car": "Scaleauto BMW Z4 GT3",
      "configuration": "Scaleauto BMW Z4 GT3 Bangers Racing #20 · Global GT 2025 Prepared proxy car · measured entry R78 · S54 · S56",
      "layout": "AW; Slot.it Flat 6S 22.5k",
      "tyres": "NSR Ultra rear Width: Front 8 mm; rear 10 mm",
      "mass": "90.0 g — derived F + R",
      "wheelbase": "Not reported",
      "report": "Viking host found this car particularly enjoyable to drive; no isolated reason demonstrated. Setup/change: Scaleauto body/chassis with replacement motor and tyres. Slight glazing displacement noted before racing, considered cosmetic by host. Traction magnet: Not independently established for this specimen Measurement and evidence notes Sheet reports F 35.9 g / R 54.1 g. Sum is derived, not a separately documented total weighing. This row links the measured entry to a venue observation; it does not establish a quantified multi-track handling trend.",
      "sources": [
        "S54",
        "S56"
      ]
    },
    {
      "id": "R79",
      "brand": "Fly",
      "car": "Fly Corvette C5R",
      "configuration": "Fly Corvette C5R ModSports #3 · Global GT 2025 Custom 3D chassis · linked venues R79 · S54 · S55 · S56 · S57",
      "layout": "AW; Predator 21.5k",
      "tyres": "NSR Ultra rear Width: Front 9.3 mm; rear 10 mm",
      "mass": "101.1 g — derived F + R",
      "wheelbase": "Not reported",
      "report": "Class winner at Wirral and Trelawney. Viking feedback: good in flowing corners, less effective braking and accelerating through tight ones. Setup/change: Fly body on a 3D chassis, maker unspecified; not representative of a stock Fly car. Traction magnet: Not independently established for this specimen Measurement and evidence notes Sheet reports F 45 g / R 56.1 g. Separate car from the series’ #71 Corvette. Venue results are one car history, not independent replicas.",
      "sources": [
        "S54",
        "S55",
        "S56",
        "S57"
      ]
    }
  ],
  "sources": [
    {
      "id": "S1",
      "title": "S1 · NSR Mosler preparation",
      "context": "S1 · NSR Mosler preparation Forum · 2009-03 Different owners; plastic tracks. Layout and magnet status are retained only where stated. Reports are not controlled trials.",
      "url": "https://www.franceslotforum.com/forum/nsr-mosler-preparation-1347881.html"
    },
    {
      "id": "S2",
      "title": "S2 · NSR GT3 setup and owner comparisons",
      "context": "S2 · NSR GT3 setup and owner comparisons Forum · 2017–2018 HuGorrera and replies; modified club cars, mainly Carrera. AW inferred from the described long-can GT3 builds. Indexed full text reviewed; direct fetch blocked.",
      "url": "https://www.freeslotter.de/index.php?highlight=Nsr&postID=1051317&thread%2F87420-um-und-aufbau-eines-nsr-gt3-nach-nsr-gt3-reglement-f%C3%BCr-newbies%2F="
    },
    {
      "id": "S3",
      "title": "S3 · Mercedes 190E CA44a review",
      "context": "S3 · Mercedes 190E CA44a review Forum · 2020-01 CMOTD; 50-foot wooden track. Initial assembly faults corrected; body float adjusted. Traction-magnet removal not explicitly documented.",
      "url": "https://slotracer.online/community/showthread.php?tid=1003"
    },
    {
      "id": "S4",
      "title": "S4 · DTM comparison: Mercedes, Alfa, Opel",
      "context": "S4 · DTM comparison: Mercedes, Alfa, Opel Forum · 2019-11 slotloco: 65/70-foot wood tracks; N22 tyres swapped between cars. Factory-reference dimensions from woodcote; not measured race weights. Same tester as a reply in S3: not independent replication.",
      "url": "https://slotracer.online/community/showthread.php?tid=921"
    },
    {
      "id": "S5",
      "title": "S5 · Scaleauto Racing Series 991",
      "context": "S5 · Scaleauto Racing Series 991 Forum · 2020-01 slotloco; 20-metre technical wooden track, magnet removed. Multiple preparation changes; no isolated ballast trial. Proposed extra front weight was not tested in this report.",
      "url": "https://slotracer.online/community/showthread.php?tid=1046"
    },
    {
      "id": "S6",
      "title": "S6 · Scaleauto Home Series 991",
      "context": "S6 · Scaleauto Home Series 991 Forum · 2020-01 slotloco; same track as S5. Chassis cracked during preparation, repaired and braced. This is not a clean motor-layout comparison.",
      "url": "https://slotracer.online/community/showthread.php?tid=1038"
    },
    {
      "id": "S7",
      "title": "S7 · Scaleauto Porsche 963 owner discussion",
      "context": "S7 · Scaleauto Porsche 963 owner discussion Forum · 2023-09–10 Early kits; FastenBelts on Ninco and MxBoy on Carrera. Do not generalise early assembly problems to later revisions. Traction-magnet status not established.",
      "url": "https://www.franceslotforum.com/forum/porsche-963-scaleauto-1535316.html"
    },
    {
      "id": "S8",
      "title": "S8 · Slot.it Toyota GR010 preparation",
      "context": "S8 · Slot.it Toyota GR010 preparation Forum · 2025-11 Mbmx; Bordeaux Carrera club track. Stock configuration explicitly not tested. Replies propose causes of hopping; no confirmed repair reported.",
      "url": "https://www.franceslotforum.com/forum/test-et-preparation-toyota-gr010-slot-it-1537534.html"
    },
    {
      "id": "S9",
      "title": "S9 · NSR Formula 22 race report",
      "context": "S9 · NSR Formula 22 race report Club report · 2024-09-26 Prepared Formula 22 cars, different chassis hardnesses. Race results do not isolate chassis stiffness or driver effects.",
      "url": "https://austinslotcarclub.com/nsr-formula-22-race-1/"
    },
    {
      "id": "S10",
      "title": "S10 · NSR Formula 22/26 manufacturer sheet",
      "context": "S10 · NSR Formula 22/26 manufacturer sheet Manufacturer · Accessed 2026-11-13 Inline configuration reference only; promotional performance claims are not handling observations.",
      "url": "https://nsrslot.com/en/formula-22-26-scheda-tecnica-2/"
    },
    {
      "id": "S11",
      "title": "S11 · 2006 NSR Mosler review",
      "context": "S11 · 2006 NSR Mosler review Firsthand review · 2006-08-13 Philippe Marchand; magnet removed, body/pod float, motor/bushings secured. Historical sidewinder release, not a modern AW Mosler.",
      "url": "https://www.homeracingworld.com/nsrmosler.htm"
    },
    {
      "id": "S12",
      "title": "S12 · Slot.it Matra comparison",
      "context": "S12 · Slot.it Matra comparison Firsthand review · 2014-04-01 Harry; small routed MDF/latex track, no magnet. Same Paul Gage XPG20115 tyres, front-axle adjustment and body/pod float; no ballast. McLaren exact model not established from accessible text, so omitted.",
      "url": "https://www.homeracingworld.us/Reviews/SlotitMatra/slotitmatra.htm"
    },
    {
      "id": "S13",
      "title": "S13 · Scaleauto Pantera review",
      "context": "S13 · Scaleauto Pantera review Firsthand review · 2014-05-11 Manic; Carrera home track. Reported total/body masses are review measurements, not confirmed after every modification. Rim measurements not copied into tyre-width fields.",
      "url": "https://manicslots.blogspot.com/2014/05/review-scaleauto-detomaso-pantera.html"
    },
    {
      "id": "S14",
      "title": "S14 · Scaleauto BMW Z4 review",
      "context": "S14 · Scaleauto BMW Z4 review Firsthand review · 2014-07-02 Manic; Carrera with elevation changes. Total/body mass reported for reviewed car. Magnet changes and basic preparation are separate from stock behaviour.",
      "url": "https://manicslots.blogspot.com/2014/07/review-scaleauto-bmw-z4-super-gt.html?m=1"
    },
    {
      "id": "S15",
      "title": "S15 · Scaleauto Spyker C8 review",
      "context": "S15 · Scaleauto Spyker C8 review Firsthand review · 2014-06 Manic; Carrera with humps. Total/body mass reported for reviewed car. Ambiguous wording about lap-time direction excluded.",
      "url": "https://manicslots.blogspot.com/2014/06/review-scaleauto-spyker-c8-gt2-r.html"
    },
    {
      "id": "S16",
      "title": "S16 · NSR Audi R8 and Slot.it R390 owner builds",
      "context": "S16 · NSR Audi R8 and Slot.it R390 owner builds Firsthand owner blog · 2015-05–06 giese54; Carrera. Multiple simultaneous modifications; R390 versions also differ in chassis generation and body length. Not an isolated layout experiment.",
      "url": "https://jcslot.wordpress.com/"
    },
    {
      "id": "S17",
      "title": "S17 · Slot.it Porsche 962C modified build",
      "context": "S17 · Slot.it Porsche 962C modified build Firsthand owner blog · 2015-05-06 giese54; Carrera. Older body, replacement suspended pod, NSR King motor and magnesium wheels. Suggested Ninco test not yet performed.",
      "url": "https://jcslot.wordpress.com/2015/05/06/porsche-962c-blaupunkt-slot-it/"
    },
    {
      "id": "S18",
      "title": "S18 · Slot.it R390 GT1 2018 review",
      "context": "S18 · Slot.it R390 GT1 2018 review Firsthand review · 2018-06-04 Harry; painted surface. Front axle adjusted, excess play corrected, Quick Slicks fitted. Reported masses are review measurements; final modified mass unreported.",
      "url": "https://homeracingworld.us/TeamHRW/slot-it-nissan-r390-gt1-2018/"
    },
    {
      "id": "S19",
      "title": "S19 · Slot.it Nissan R390 Longtail test",
      "context": "S19 · Slot.it Nissan R390 Longtail test Firsthand magazine test · 2009-07 Jim Hunt Magazine 12; 70-metre course, magnet removed, tyres sanded, float adjusted, no ballast. Indexed report/table read; full PDF exceeds browser size limit.",
      "url": "https://www.jim-hunt-magazine.de/downloads/Jim_Hunt_Magazine_No.12.pdf"
    },
    {
      "id": "S20",
      "title": "S20 · NSR Porsche 908/3 review",
      "context": "S20 · NSR Porsche 908/3 review Firsthand review · 2024-09-29 Harry; small MID-MO track. Stock assumed for handling description; guide replacement mentioned only as a possibility.",
      "url": "https://homeracingworld.us/TeamHRW/1-32-nsr-porsche-908-3/"
    },
    {
      "id": "S21",
      "title": "S21 · Policar BRM P153 preparation",
      "context": "S21 · Policar BRM P153 preparation Owner blog · 2024-04-29 JC Giese; home track, surface not established here. Several simultaneous changes; opening comparison is ambiguous, so the detailed preparation outcome is used.",
      "url": "https://jcgiese.github.io/jc_gh_slot/2024/04/29/brm-p153-policar/"
    },
    {
      "id": "S22",
      "title": "S22 · Policar Lotus 72 JPS",
      "context": "S22 · Policar Lotus 72 JPS Owner blog · 2023-03-30 JC Giese; grey-painted home track. Rear-overhang explanation is the owner's hypothesis, not an isolated mass-distribution test.",
      "url": "https://jcgiese.github.io/jc_gh_slot/2023/03/30/lotus-72-jps-policar/"
    },
    {
      "id": "S23",
      "title": "S23 · Policar Ferrari 126 C2",
      "context": "S23 · Policar Ferrari 126 C2 Owner blog · 2023-07-30 JC Giese; home race evening. Proposed front-axle check has no reported outcome. Do not infer grip directly from quoted Shore hardness.",
      "url": "https://jcgiese.github.io/jc_gh_slot/2023/07/30/ferrari-126-c2--policar/"
    },
    {
      "id": "S24",
      "title": "S24 · Black Arrow Aston Martin DBR9",
      "context": "S24 · Black Arrow Aston Martin DBR9 Firsthand review · 2013-11-15 Manic; Carrera with straights up to 4.5 m. BACM01C inline specimen; AW upgrade discussed but not tested. Indexed full review read; direct fetch rate-limited.",
      "url": "https://manicslots.blogspot.com/2013/11/review-black-arrow-aston-martin-dbr9.html"
    },
    {
      "id": "S25",
      "title": "S25 · Black Arrow owner comparisons",
      "context": "S25 · Black Arrow owner comparisons Forum · 2019–2020 countbasie64; Ninco. Owner compares a collection, not matched specimens. Other replies disagree about motor suitability; no controlled layout comparison.",
      "url": "https://www.franceslotforum.com/forum/que-vaut-la-marque-black-arrow-1531287.html"
    },
    {
      "id": "S26",
      "title": "S26 · Avant Slot Peugeot 908 first runs",
      "context": "S26 · Avant Slot Peugeot 908 first runs Firsthand guest review · 2008-01-19 parryana; Slotshop Artin, 10 V without traction magnet. The article's Audi naming is inconsistent and is not used as a separate record.",
      "url": "https://manicslots.blogspot.com/2008/01/reviewnew-kids-on-block.html"
    },
    {
      "id": "S27",
      "title": "S27 · Avant Slot Pescarolo owner discussion",
      "context": "S27 · Avant Slot Pescarolo owner discussion Forum · 2008-01-23 JASEN63, post 27; club testing, surface unspecified. Indexed post read; direct fetch has a decoding error. Preparation unspecified; strong enthusiasm is not a measured effect size.",
      "url": "https://slotadictos.mforos.com/21954/6629199-pescarolo-avant-slot/"
    },
    {
      "id": "S28",
      "title": "S28 · FlySlot Porsche 917 revised inline chassis",
      "context": "S28 · FlySlot Porsche 917 revised inline chassis Firsthand review · 2012-02-22 Christian Hillairaud; CROTT test track. 2012 #24 Gulf release, distinct from earlier sidewinders. Several faults corrected together.",
      "url": "https://www.circuits-routiers.fr/_index_article_54.htm"
    },
    {
      "id": "S29",
      "title": "S29 · FlySlot Alpha Porsche 917 LH",
      "context": "S29 · FlySlot Alpha Porsche 917 LH Firsthand retailer-hosted review · 2013-04-08 Michael Ashton; Ninco N-Digital. Magnet and throttle profiles change together in timed comparisons; do not attribute time differences solely to magnet position.",
      "url": "https://brshobbies.blogspot.com/2013/04/flyslot-porsche-917-lh-slot-car.html"
    },
    {
      "id": "S30",
      "title": "S30 · MR SlotCar Mazda 787B owner comparisons",
      "context": "S30 · MR SlotCar Mazda 787B owner comparisons Forum · 2011-05–07 jc on Carrera and Fair at Nantes club. Separate owners/setups: P6 comparison favours Slot.it slightly; BRM-tyred club comparison favours MR. No matched timing for the latter.",
      "url": "https://www.franceslotforum.com/forum/comparatif-mazda-slot-itmrslotcar-1478289.html?pgi=83"
    },
    {
      "id": "S31",
      "title": "S31 · MR SlotCar Shadow DN4 test",
      "context": "S31 · MR SlotCar Shadow DN4 test Forum · 2023-07-05–13 Stargazers65 / Cédric P; C24T Carrera, 13 V. Followed initial presentation through actual July 13 test. Later page unavailable; proposed guide/gearing changes are not recorded as successful repairs.",
      "url": "https://www.franceslotforum.com/forum/essai-shadow-dn4-mr-slot-car-1535252.html"
    },
    {
      "id": "S32",
      "title": "S32 · Ninco Mosler LeyJun lightened edition",
      "context": "S32 · Ninco Mosler LeyJun lightened edition Firsthand review · 2008-08-16 Shawn Smith; 60-foot test track. Sponsored specimen, stock magnet. Author explicitly cannot isolate lighter interior, revised tyres or motor mounting as the cause.",
      "url": "https://www.homeracingworld.com/S9mosler.htm"
    },
    {
      "id": "S33",
      "title": "S33 · Ninco Mercedes C-Class with replacement chassis",
      "context": "S33 · Ninco Mercedes C-Class with replacement chassis Firsthand tuning report · undated Slottest; club track. Article title says Kilslot, but build narrative specifies Olifer. Narrative used; inconsistent parts list excluded. Modified chassis is not stock Ninco evidence.",
      "url": "https://www.slottest.net/mercedes-c-klasse-ninco"
    },
    {
      "id": "S34",
      "title": "S34 · Pioneer Bullitt Mustang",
      "context": "S34 · Pioneer Bullitt Mustang Firsthand review · 2009-11-14 Manic; Carrera with humps. 87 g is the review's listed specification, not the confirmed post-ballast mass. Tyre preparation and running-in also changed.",
      "url": "https://manicslots.blogspot.com/2009/11/review-pioneer-bullitt-mustang.html"
    },
    {
      "id": "S35",
      "title": "S35 · Pioneer Mustang notchback kits",
      "context": "S35 · Pioneer Mustang notchback kits Firsthand review · 2010-02-10 David Reinecke; pre-production kits, PDR at 11.5 V. Magnet and non-magnet tests use different cars. Comparison Scalextrics had forgotten ballast and sanded tyres.",
      "url": "https://www.homeracingworld.com/D2.htm"
    },
    {
      "id": "S36",
      "title": "S36 · Racer Sideways Ford Capri tuning",
      "context": "S36 · Racer Sideways Ford Capri tuning Firsthand tuning report · undated Slottest; multiple chassis and drivetrain changes. Specific sample fit problems; not a claim about every Capri or every later chassis batch.",
      "url": "https://www.slottest.net/ford-capri-sideways-eng"
    },
    {
      "id": "S37",
      "title": "S37 · Racer Sideways Ferrari 512 Group 5",
      "context": "S37 · Racer Sideways Ferrari 512 Group 5 Firsthand tuning report · undated Slottest; staged build including a reconstructed standard configuration. 17.9 g refers to the body with lightweight interior, not total car mass.",
      "url": "https://www.slottest.net/ferrari-512-sideways"
    },
    {
      "id": "S38",
      "title": "S38 · Racer Sideways Lancia Beta",
      "context": "S38 · Racer Sideways Lancia Beta Firsthand tuning report · undated Slottest; tests span a club move and a driver change. Suspected bearing looseness remains unresolved. Geometry-based explanation is not established causation.",
      "url": "https://www.slottest.net/lancia-beta-sideways"
    },
    {
      "id": "S39",
      "title": "S39 · Thunderslot Lola T70 MkIII",
      "context": "S39 · Thunderslot Lola T70 MkIII Firsthand review · 2016-08 Harry; small home track, no traction magnet. Early batch; missing rear support bracket supplied for test. Sponsored review; stock and tyre-preparation comments distinguished.",
      "url": "https://www.homeracingworld.us/Reviews/2016/Thunderslot/Thunder%20Slot%20Lola%20MKIII.html"
    },
    {
      "id": "S40",
      "title": "S40 · Thunderslot Ferrari 350 Can-Am comparison",
      "context": "S40 · Thunderslot Ferrari 350 Can-Am comparison Firsthand magazine test · 2024-09/10 Slot Magazine 65, printed pages 42–47; Policar home track. Ferrari, kit-built Lola and race-prepared McLaren differ in preparation. Untimed impressions cannot establish equivalent lap performance.",
      "url": "https://www.thunderslot.com/wp-content/uploads/2024/09/p-42-47-Review-CanAm-065.pdf"
    },
    {
      "id": "S41",
      "title": "S41 · Thunderslot McLaren Elva tyre and float test",
      "context": "S41 · Thunderslot McLaren Elva tyre and float test Forum · 2020-06-01 Stargazers65 / Cédric P; Pierre B's 41.5 m Carrera. Stock tyres incompletely bedded; later session includes practice and screw adjustments. Two controllers used, best times with MB-Slot.",
      "url": "https://www.franceslotforum.com/forum/essai-mclaren-elva-thunderslot-1532197.html"
    },
    {
      "id": "S42",
      "title": "S42 · Thunderslot McLaren M6A/B white-kit build and test",
      "context": "S42 · Thunderslot McLaren M6A/B white-kit build and test SlotCarMAGAZINE 45 · September 2018 Ric Woods’s completed kit test is distinct from Marc Abbott’s test of a manufacturer-prepared car. Source PDF is hosted by Thunderslot.",
      "url": "https://www.thunderslot.com/wp-content/uploads/2022/11/SCM_sept_2018.pdf"
    },
    {
      "id": "S43",
      "title": "S43 · Sideways BMW M6 white-kit assembly diary",
      "context": "S43 · Sideways BMW M6 white-kit assembly diary Tamar · SlotRacer · May–June 2020 Assembly observations only; retained below the handling table. No verified before/after handling outcome was found in the reviewed three-page diary.",
      "url": "https://slotracer.online/community/showthread.php?tid=1233"
    },
    {
      "id": "S44",
      "title": "S44 · Austin Thunderslot proxy — round 4",
      "context": "S44 · Austin Thunderslot proxy — round 4 porsche917 · 7 September 2020 Indexed report reviewed; direct fetch failed. Same club series, multiple drivers, not a multi-track tour. Surface and magnet rules not established from these reports. A joke about magnets is excluded.",
      "url": "https://austinslotcarclub.com/thunderslot-proxy-race-4/"
    },
    {
      "id": "S45",
      "title": "S45 · Austin Thunderslot proxy — round 5",
      "context": "S45 · Austin Thunderslot proxy — round 5 porsche917 · 20 September 2020 Follow-up confirms Ary’s replacement tyres and continuing McLaren performance. Race placement is not an isolated measure of tyre effectiveness.",
      "url": "https://austinslotcarclub.com/thunderslot-race-5-results/"
    },
    {
      "id": "S46",
      "title": "S46 · Scaleauto Audi R8 LMS white-kit review",
      "context": "S46 · Scaleauto Audi R8 LMS white-kit review Giovanni Russello · DiSCA · 14 July 2018 Indexed article reviewed; direct fetch returned an error. Digital GT3 race preparation, not manufacturer-stock configuration. Track surface and complete measurements remain unknown.",
      "url": "https://www.officialdisca.com/2018/07/new-scaleauto-audi-r8-lms-review/"
    },
    {
      "id": "S47",
      "title": "S47 · Scaleauto Peugeot 9X8 preparation",
      "context": "S47 · Scaleauto Peugeot 9X8 preparation MxBoy · FranceSlotforum · July 2024 Only MxBoy’s build is used here. Another contributor’s warped chassis belongs to a different specimen. The proposed motor swap is not treated as completed; S53 provides a later account.",
      "url": "https://www.franceslotforum.com/forum/preparation-9x8-1536338.html"
    },
    {
      "id": "S48",
      "title": "S48 · NSR Formula 86/89: paired driver and tyre tests",
      "context": "S48 · NSR Formula 86/89: paired driver and tyre tests LittleBen / LittleTom · FranceSlotforum · April 2020 Author corrected the original compound interpretation: replacement tyres had a different profile, not a newly introduced SuperGrip compound. Two cars in one testing programme, not independent replication.",
      "url": "https://www.franceslotforum.com/forum/nsr-formula-ferrari-f1-8788c-tests-croises-de-pere-en-fils-1531962.html"
    },
    {
      "id": "S49",
      "title": "S49 · Ten prepared GT3s — observed behaviour and results",
      "context": "S49 · Ten prepared GT3s — observed behaviour and results Marsu · FranceSlotforum · May–July 2021 One comparison group. Lane barriers, familiarity and preparation affect rankings. Best-lap order differs from consecutive-lap order. Owner’s magnetic-grip explanation is not a force measurement.",
      "url": "https://www.franceslotforum.com/forum/10-gt3-en-piste-1533406.html?page=2"
    },
    {
      "id": "S50",
      "title": "S50 · Black Arrow Italia Competizione kit build",
      "context": "S50 · Black Arrow Italia Competizione kit build LittleBen · FranceSlotforum · August 2017 Indexed posts reviewed; direct fetch failed. Later posts by other owners are not follow-ups to this particular car.",
      "url": "https://www.franceslotforum.com/forum/black-arrow-gt3-italia-1527984.html?page=4&pgi=2"
    },
    {
      "id": "S51",
      "title": "S51 · Sideways Nissan Skyline: prepared AW and converted SW",
      "context": "S51 · Sideways Nissan Skyline: prepared AW and converted SW slotloco · SlotRacer · 10 April 2020 Two stages of one car. Reported tyre-envelope width is not contact-centre rear track. Stage measurements must not be merged.",
      "url": "https://slotracer.online/community/printthread.php?tid=1190"
    },
    {
      "id": "S52",
      "title": "S52 · Ten prepared GT3s — common rules and setup",
      "context": "S52 · Ten prepared GT3s — common rules and setup Marsu · FranceSlotforum · May 2021 Raptor 21k motors, 12:28 gearing, Sideways Medium 20 × 11 rear tyres and 22 g minimum body rule. Minimum body rule is not measured total mass. Home circuit is named Cockpist; Polistil appears in the author profile, not a verified surface description.",
      "url": "https://www.franceslotforum.com/forum/10-gt3-en-piste-1533406.html"
    },
    {
      "id": "S53",
      "title": "S53 · Scaleauto Porsche 963 chassis experiments and 9X8 follow-up",
      "context": "S53 · Scaleauto Porsche 963 chassis experiments and 9X8 follow-up MxBoy · FranceSlotforum · July–August 2024 Builds vary in motor, tyres and suspension. Author later proposes standardising these. Inconsistent timing totals excluded; qualitative observations retained. Repeated posts by this owner are linked rather than counted as independent corroboration.",
      "url": "https://www.franceslotforum.com/forum/presentation-et-tests-de-divers-chassis-p963-scaleauto-1536350.html"
    },
    {
      "id": "S54",
      "title": "S54 · Global GT Challenge 2025 — Procar scrutineering and technical report",
      "context": "S54 · Global GT Challenge 2025 — Procar scrutineering and technical report Organiser PDF · 2025 Pages 1–2 visually checked for selected entries. Tyre width and F/R mass columns are distinct. Unspecified fixtures prevent converting the readings into CG or universal magnetic-force predictions.",
      "url": "https://slotracer.online/community/attachment.php?aid=40282"
    },
    {
      "id": "S55",
      "title": "S55 · Global GT 2025 — round 1, Wirral",
      "context": "S55 · Global GT 2025 — round 1, Wirral Graham · 12–15 April 2025 Smooth routed track. Class results identify Demon Tweeks #37 and ModSports #3. Procar heats were shorter than the other classes; raw lap totals across classes are not directly comparable.",
      "url": "https://slotracer.online/community/printthread.php?page=9&tid=4745"
    },
    {
      "id": "S56",
      "title": "S56 · Global GT 2025 — round 2, Viking driver feedback",
      "context": "S56 · Global GT 2025 — round 2, Viking driver feedback Ade C · 29 April–1 May 2025 12 V and Truspeed BP2 controllers; drivers stayed on assigned lanes as cars rotated. Flowing yellow lane also had a particularly quick driver. Host observations cannot isolate track geometry from driver effects.",
      "url": "https://slotracer.online/community/printthread.php?page=12&tid=4745"
    },
    {
      "id": "S57",
      "title": "S57 · Global GT 2025 — round 3, Trelawney",
      "context": "S57 · Global GT 2025 — round 3, Trelawney Graham · 16–19 May 2025 Repeated class wins for the identified Lamborghini and Fly-bodied Corvette. The series also documents transit damage; histories need repair/state records, not just standings.",
      "url": "https://slotracer.online/community/printthread.php?page=14&tid=4745"
    },
    {
      "id": "S58",
      "title": "S58 · Slot.it Maserati MC GT3 — initial weighing and staged preparation",
      "context": "S58 · Slot.it Maserati MC GT3 — initial weighing and staged preparation LittleBen · 11–12 July 2020 Carrera home track. Best laps improve through successive preparation; driver practice and changing grip are not controlled. Initial mass is not the final modified mass.",
      "url": "https://www.franceslotforum.com/forum/little-test-de-la-maserati-mc-gt3-de-slot-it-1532346.html"
    },
    {
      "id": "S59",
      "title": "S59 · Slot.it Maserati MC GT3 — ballast removal, restoration and gearing",
      "context": "S59 · Slot.it Maserati MC GT3 — ballast removal, restoration and gearing LittleBen · 12–15 July 2020 Direct follow-up read. Ballast and screw changes were initially combined. Later restoration also uses a different gear, so the sequence is not a clean reversal experiment. No full lap distributions supplied.",
      "url": "https://www.franceslotforum.com/forum/little-test-de-la-maserati-mc-gt3-de-slot-it-1532346.html?page=1"
    },
    {
      "id": "S60",
      "title": "S60 · NSR Mosler — decorated body mass claim",
      "context": "S60 · NSR Mosler — decorated body mass claim pasionslot76 · December 2010 · indexed text only Direct page blocked. Starting measurement provenance, assembly consistency and scale are unresolved. Not accepted as measured paint mass.",
      "url": "https://slotadictos.mforos.com/26469/8132449-club-mosler-nsr/?pag=7"
    },
    {
      "id": "S61",
      "title": "S61 · Custom TCR bodies — itemised completion mass",
      "context": "S61 · Custom TCR bodies — itemised completion mass Marsu · 18 April 2022 Primary build account distinguishes some added parts from finish. Included as a measurement-method lead only, not a new manufacturer or handling record.",
      "url": "https://www.franceslotforum.com/forum/la-categorie-tcr-en-slot-1534135.html"
    }
  ]
};if(typeof module==='object'&&module.exports)module.exports=data;else root.HandlingEvidence=data;})(globalThis);
