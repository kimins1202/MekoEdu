export type CourseSection = {
  id: number;
  name: string;
  section: number;
  modules: {
    id: number;
    instance: number;
    modname: string;
  }[];
};
