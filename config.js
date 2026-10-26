/* Wedding cabinet settings.
   Change the values below. The screen and the Save the Date button both read this file. */

var WEDDING = {
  partner1: "Chandrima",
  partner2: "Debopriyo",

  /* YYYY-MM-DD. Leave "" until the day is final. */
  date: "2027-01-29",

  /* Cocktail the evening before. Same place. No clock time, so the calendar hold stays all day. */
  cocktailDate: "2027-01-28",

  /* 24-hour clock in timeZone. Leave both "" for an all-day hold. */
  startTime: "",
  endTime: "",

  /* Used only when a start time is set. */
  timeZone: "Asia/Kolkata",

  venue: "Taj Taal Kutir",
  city: "Kolkata",
  address: "",

  /* Opens when a guest taps OPEN MAP. Leave "" to search the venue name. */
  mapUrl: "https://maps.app.goo.gl/FMAhjzoUYA8xVUJa9",
  dressCode: "",

  /* Optional invite copy. Separate paragraphs with a blank line.
     Leave "" to say the wedding day, the venue, and the cocktail evening. */
  story: "",

  /* Extra line inside the calendar event. */
  note: "",

  /* Fill one RSVP option to open the desk.
     rsvpUrl: paste the Google Form link here when it is ready.
     The form should ask for a name and how many people are coming.
     formspreeId: the id from https://formspree.io/f/xxxxxxxx
     rsvpEmail: opens the guest's mail app.

     rsvpSheetUrl: cocktail RSVP -> Google Sheet.
     Sheet: https://docs.google.com/spreadsheets/d/14ZOo55uOwUyEtT7S_NGhoMiTbKpQ3uy5K9rYnEut6sc/edit
     Deploy rsvp-sheet.gs as an Apps Script Web App (Execute as: Me, Who has access: Anyone),
     then paste the /exec URL here. It appends Name and Total Number of Guests.
     Leave "" to use the Formspree/email form instead.

     Deployed endpoint (verified anonymous, found Sheet1):
     https://script.google.com/macros/s/AKfycbz0kgwbo-HQhwM56fexDb4GIK2-0mI0mbIGopfCsi2SpSLv9ZQRhbH2jV9CLW86uPFEfQ/exec */
  rsvpUrl: "",
  formspreeId: "",
  rsvpEmail: "",
  rsvpSheetUrl: "https://script.google.com/macros/s/AKfycbz0kgwbo-HQhwM56fexDb4GIK2-0mI0mbIGopfCsi2SpSLv9ZQRhbH2jV9CLW86uPFEfQ/exec"
};
