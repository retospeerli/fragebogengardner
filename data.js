// Reihenfolge im Spider-Web (Start 12 Uhr, im Uhrzeigersinn):
// logisch -> räumlich -> körper -> musikalisch -> interpersonal -> sprachlich -> intrapersonal -> existenziell -> naturbezogen
const INTELLIGENCES = [
  { key: "logisch",     label: "Logisch-mathematisch",        icon: "assets/icons/logisch.png" },
  { key: "raeumlich",   label: "Räumlich-visuell",            icon: "assets/icons/raeumlich.png" },
  { key: "koerper",     label: "Körperlich-kinästhetisch",    icon: "assets/icons/koerper.png" },
  { key: "musikalisch", label: "Musikalisch",                 icon: "assets/icons/musikalisch.png" },
  { key: "inter",       label: "Interpersonal",               icon: "assets/icons/inter.png" },
  { key: "sprachlich",  label: "Sprachlich",                  icon: "assets/icons/sprachlich.png" },
  { key: "intra",       label: "Intrapersonal",               icon: "assets/icons/intra.png" },
  { key: "exist",       label: "Existenziell",                icon: "assets/icons/exist.png" },
  { key: "natur",       label: "Naturbezogen",                icon: "assets/icons/natur.png" },
];

// Aussagen (klarer formuliert; weiterhin 6 pro Bereich)
const QUESTIONS = [
  // logisch-mathematisch
  { id:"l1", intel:"logisch", text:"Ich rechne gerne (plus, minus, mal, geteilt) und übe das freiwillig." },
  { id:"l2", intel:"logisch", text:"Ich löse gern Sachaufgaben, bei denen man nachdenken und rechnen muss." },
  { id:"l3", intel:"logisch", text:"Ich mag Logikrätsel (z.B. Sudoku, Logicals) und suche gern die Lösung." },
  { id:"l4", intel:"logisch", text:"Ich interessiere mich dafür, wie Formen und Muster in Mathe funktionieren." },
  { id:"l5", intel:"logisch", text:"Ich finde es spannend, Dinge am Computer zu planen (z.B. CAD, 3D-Druck)." },
  { id:"l6", intel:"logisch", text:"Ich erkenne gern Regeln oder Muster (z.B. in Zahlenfolgen oder Spielen)." },

  // räumlich-visuell
  { id:"r1", intel:"raeumlich", text:"Ich zeichne, gestalte oder designe gern (Bilder, Plakate, Modelle)." },
  { id:"r2", intel:"raeumlich", text:"Ich baue gern Dinge (z.B. LEGO, Bauklötze) und probiere Formen aus." },
  { id:"r3", intel:"raeumlich", text:"Ich kann Karten, Pläne oder Baupläne gut lesen und mich daran orientieren." },
  { id:"r4", intel:"raeumlich", text:"Ich kann mir im Kopf gut vorstellen, wie etwas von allen Seiten aussieht." },
  { id:"r5", intel:"raeumlich", text:"Ich würde gern Trickfilm/Legetrick machen und Bilder in Bewegung bringen." },
  { id:"r6", intel:"raeumlich", text:"Ich entwerfe gern eigene Ideen (z.B. ein Objekt, ein Logo oder ein Modell)." },

  // körperlich-kinästhetisch
  { id:"k1", intel:"koerper", text:"Ich bastle oder baue gern mit den Händen (z.B. Werkstatt, Making)." },
  { id:"k2", intel:"koerper", text:"Ich arbeite gern mit Werkzeug (z.B. schneiden, schrauben, kleben, messen)." },
  { id:"k3", intel:"koerper", text:"Ich bewege mich gern (Sport, Spielen, draussen aktiv sein)." },
  { id:"k4", intel:"koerper", text:"Ich lerne besser, wenn ich etwas praktisch ausprobieren darf (statt nur lesen)." },
  { id:"k5", intel:"koerper", text:"Ich mag Projekte, bei denen man Dinge zusammenbaut und testet (z.B. Technik)." },
  { id:"k6", intel:"koerper", text:"Ich kann Aufgaben gut, bei denen man geschickt und genau arbeiten muss." },

  // musikalisch
  { id:"m1", intel:"musikalisch", text:"Ich höre gerne Musik und achte darauf, wie sie klingt." },
  { id:"m2", intel:"musikalisch", text:"Ich singe gern oder mache gern Musik (auch nur für mich)." },
  { id:"m3", intel:"musikalisch", text:"Ich merke mir Dinge leichter, wenn Rhythmus oder Musik dabei ist." },
  { id:"m4", intel:"musikalisch", text:"Ich klatsche oder trommle gern Rhythmen und probiere Beats aus." },
  { id:"m5", intel:"musikalisch", text:"Ich würde gern ein Hörspiel aufnehmen oder Geräusche/Musik dazu machen." },
  { id:"m6", intel:"musikalisch", text:"Ich höre genau hin und bemerke schnell, wenn sich ein Klang verändert." },

  // interpersonal
  { id:"i1", intel:"inter", text:"Ich helfe anderen Menschen gern (z.B. erklären, unterstützen, trösten)." },
  { id:"i2", intel:"inter", text:"Ich arbeite gern mit anderen zusammen und fühle mich im Team wohl." },
  { id:"i3", intel:"inter", text:"Ich erkläre anderen gern etwas, damit sie es besser verstehen." },
  { id:"i4", intel:"inter", text:"Ich diskutiere gern fair und kann auch andere Meinungen anhören." },
  { id:"i5", intel:"inter", text:"Ich mag Teamprojekte, bei denen jede Person eine Aufgabe übernimmt." },
  { id:"i6", intel:"inter", text:"Ich höre anderen Menschen aufmerksam zu und versuche sie gut zu verstehen." },

  // sprachlich
  { id:"s1", intel:"sprachlich", text:"Ich lese gern (z.B. Bücher, Comics oder Sachtexte) und bleibe dran." },
  { id:"s2", intel:"sprachlich", text:"Ich schreibe gern Texte (z.B. Geschichten, Tagebuch, Berichte)." },
  { id:"s3", intel:"sprachlich", text:"Ich erfinde gern eigene Geschichten oder Ideen und erzähle sie." },
  { id:"s4", intel:"sprachlich", text:"Ich spiele gern Theater oder Rollenspiele und spreche gern vor anderen." },
  { id:"s5", intel:"sprachlich", text:"Ich kann Dinge gut mit Worten erklären (mündlich oder schriftlich)." },
  { id:"s6", intel:"sprachlich", text:"Ich spiele gern mit Sprache (Reime, Wortspiele, lustige Formulierungen)." },

  // intrapersonal
  { id:"p1", intel:"intra", text:"Ich weiss gut, was ich gerne mache und was ich nicht gerne mache." },
  { id:"p2", intel:"intra", text:"Ich denke über meine Gefühle nach und merke, wie es mir wirklich geht." },
  { id:"p3", intel:"intra", text:"Ich kann gut allein arbeiten, ohne dass mir schnell langweilig wird." },
  { id:"p4", intel:"intra", text:"Ich mag ruhige Aufgaben, bei denen ich mich konzentrieren kann." },
  { id:"p5", intel:"intra", text:"Ich denke nach, was ich beim Lernen verbessern möchte (Selbstreflexion)." },
  { id:"p6", intel:"intra", text:"Ich setze mir Ziele (z.B. üben, dranbleiben) und versuche sie zu erreichen." },

  // existenziell
  { id:"e1", intel:"exist", text:"Ich interessiere mich für Geschichte und dafür, wie Menschen früher lebten." },
  { id:"e2", intel:"exist", text:"Ich mag Archäologie (z.B. Römer/Steinzeit) und das Forschen über die Vergangenheit." },
  { id:"e3", intel:"exist", text:"Ich denke über Gerechtigkeit nach (z.B. was fair ist und warum)." },
  { id:"e4", intel:"exist", text:"Ich frage oft nach dem «Warum» und will Dinge wirklich verstehen." },
  { id:"e5", intel:"exist", text:"Ich finde alte Kulturen spannend und frage mich, wie sie gedacht haben." },
  { id:"e6", intel:"exist", text:"Ich finde Fragen über unser Leben und unsere Existenz spannend (z.B. «Wozu sind wir da?»)." },

  // naturbezogen
  { id:"n1", intel:"natur", text:"Ich bin gern draussen und beobachte Natur (Wetter, Pflanzen, Tiere, Wald)." },
  { id:"n2", intel:"natur", text:"Ich interessiere mich für Tiere und möchte mehr über sie lernen." },
  { id:"n3", intel:"natur", text:"Ich mag Experimente und möchte wissen, warum etwas passiert." },
  { id:"n4", intel:"natur", text:"Ich würde gern mikroskopieren und winzige Dinge genau anschauen." },
  { id:"n5", intel:"natur", text:"Ich finde Fossilien und Evolution spannend und frage mich, wie Leben entsteht/entsteht." },
  { id:"n6", intel:"natur", text:"Ich mag Forschung draussen (z.B. Wasser untersuchen, Waldforschung, Spuren suchen)." },
];

const PROJECTS = [
  { id:"pr_robotik", name:"Roboter bauen & programmieren", tags:["Scratch/MakeCode/LEGO Spike/Arduino"], intels:["logisch","raeumlich","koerper","inter"] },
  { id:"pr_ki", name:"KI-Labor (Modelle trainieren & einbauen)", tags:["Teachable Machine/PictoBlox"], intels:["logisch","sprachlich","raeumlich","intra"] },
  { id:"pr_making", name:"Making-Werkstatt (löten & Schaltungen)", tags:["Elektronik/Repair"], intels:["koerper","logisch","raeumlich"] },
  { id:"pr_plants", name:"Physical Computing: Pflanzenbox", tags:["Sensoren/Automatisierung"], intels:["logisch","natur","koerper"] },
  { id:"pr_3d", name:"3D-Design & 3D-Druck", tags:["CAD/Druck"], intels:["raeumlich","logisch","koerper"] },
  { id:"pr_stopmotion", name:"Trickfilm & Legetrick", tags:["Stop-Motion"], intels:["raeumlich","sprachlich","musikalisch"] },
  { id:"pr_media", name:"Erklärvideo & Hörspiel-Studio", tags:["Filmen/Schneiden/Vertonen"], intels:["sprachlich","musikalisch","inter"] },
  { id:"pr_funk", name:"Funk & Morse (Codes senden)", tags:["NATO-Alphabet/Morsen"], intels:["logisch","sprachlich","musikalisch"] },
  { id:"pr_physik", name:"Forscherlabor Physik", tags:["Licht/Strom/Magnet/Schall"], intels:["logisch","natur","raeumlich"] },
  { id:"pr_astro", name:"Astronomie & Zeit", tags:["Sterne/Sonnenuhr"], intels:["natur","logisch","exist"] },
  { id:"pr_bio", name:"Mikroskop & Biolab", tags:["Wasser/Pflanzen/Pilze"], intels:["natur","logisch","raeumlich"] },
  { id:"pr_fossil", name:"Fossilien & Evolution", tags:["Urzeit/Modelle"], intels:["natur","exist","raeumlich"] },
  { id:"pr_chem", name:"Chemie-Experimentierküche", tags:["Reaktionen/Kristalle"], intels:["logisch","natur","koerper"] },
];
