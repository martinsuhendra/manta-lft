export interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  capacity: number;
  color: string | null;
  image: string | null;
}

export interface ClassFeature {
  label: string;
  value: string;
}

export function getClassFeatures(item: ClassItem): ClassFeature[] {
  return [
    { label: "Duration", value: `${item.duration} min` },
    { label: "Capacity", value: `Max ${item.capacity}` },
    { label: "Level", value: "All levels" },
  ];
}
