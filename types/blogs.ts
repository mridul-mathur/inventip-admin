export interface BlogSegment {
  _id?: string;
  head: string;
  subhead: string;
  content: string;
  seg_img?: string;
}

export interface Blog {
  _id?: string;
  title: string;
  brief: string;
  title_image?: string;
  segments: BlogSegment[];
}

export interface BlogFormData {
  title: string;
  brief: string;
  titleImage: File | null;
  segments: Array<BlogSegment & { image: File | null }>;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}
