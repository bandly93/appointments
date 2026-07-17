export type NoteAttachment = {
  id: number;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export type Note = {
  id: number;
  text: string;
  createdAt: string;
  author: string;
  attachments: NoteAttachment[];
}
