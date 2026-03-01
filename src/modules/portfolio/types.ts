export interface IProject {
  title: string;
  description: string;
  period?: string;
  link?: string;
  repo?: string;
  tags?: string[];
  highlights?: string[];
}

export interface IExperience {
  company: string;
  role: string;
  period: string;
  details?: string[];
}
