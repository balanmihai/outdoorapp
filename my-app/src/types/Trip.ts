export interface Participant {
  name: string;
  photo: string;
}
export interface Trip {
  id: string;
  tripName: string;
  startPoint: string;
  endPoint: string;
  startDate: Date;
  endDate: Date;
  category: string;
  difficulty: string;
  equipment: string[];
  participants: Participant[];
  authorName: string;
  authorPhoto: string;
  description?: string;
  chatId: string;
  photos: FileList;
  backgroundPhoto: File;
}
