export const API_URL = 'https://zotit.twobits.in';

export const DB = new Dexie('NotesDB');
DB.version(1).stores({
  notes: `
    id,
    text,
    created_at`
});


export const UuidRegexp =
  /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
