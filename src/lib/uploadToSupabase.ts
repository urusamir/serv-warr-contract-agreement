import type jsPDF from "jspdf";

type Answers = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function uploadToSupabase(_doc: jsPDF, _answers: Answers, _payload: Record<string, any>): Promise<void> {}
