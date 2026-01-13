
export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLETED = 'completed'
}

export enum AssetType {
  SPACE_PHOTO = 'space_photo',
  REFERENCE = 'reference',
  FURNITURE = 'furniture',
  PLAN_PDF = 'plan_pdf',
  AUDIO = 'audio'
}

export interface Palette {
  preferred: string[];
  avoid: string[];
}

export interface Directives {
  goal: string;
  palette: Palette;
  materials: string[];
  lighting: string;
  must_have: string[];
  avoid: string[];
  level_of_sophistication: number;
  decor_density: string;
  budget_target: string;
  notes: string;
}

export interface Asset {
  id: string;
  type: AssetType;
  data: string; // base64 or url
  tags: string[];
  analysis?: {
    summary: string;
    detected_style: string[];
    key_elements: string[];
    constraints: string[];
    risks: string[];
    suggested_questions: string[];
  };
}

export interface BoardVariation {
  id: string;
  name: string;
  imageUrl: string;
  client_summary: string;
  change_list: string[];
  edit_prompt: string;
  negative_prompt: string;
  constraints: string[];
}

export interface BoardVersion {
  id: string;
  timestamp: number;
  variations: BoardVariation[];
}

export interface Board {
  id: string;
  environmentId: string;
  baseAssetId: string;
  directives: Directives;
  history: BoardVersion[];
  approvedVariationId?: string;
  fixedElements: string[];
}

export interface Environment {
  id: string;
  name: string;
  goal: string;
  priority: 'low' | 'medium' | 'high';
  beforeAssetId?: string;
  referenceAssetIds: string[];
  furnitureAssetIds: string[];
  boardId?: string;
  boards: Board[];
}

export interface Moodboard {
  id: string;
  environmentId?: string;
  title: string;
  palette: Array<{ name: string; hex: string; role: string }>;
  textures: string[];
  objects: string[];
  symbols: string[];
  short_story: string;
  collageImageUri?: string;
  tileImageUris: string[];
}

export interface CrestOption {
  id: string;
  svgData: string;
  pngUri: string;
  monoPngUri: string;
  goldPngUri: string;
  promptUsed: string;
  styleName: string;
  description: string;
  usageSuggestion: string;
}

export interface Crest {
  id: string;
  initials: string;
  style: string;
  concept: string;
  options: CrestOption[];
  approvedOptionId?: string;
  usageGuide: string[];
}

export interface ProductionChecklistItem {
  id: string;
  label: string;
  category: string;
  completed: boolean;
}

export interface ProductionTimelineItem {
  id: string;
  task: string;
  start: string;
  end: string;
  responsible: string;
  supplier: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface BudgetItem {
  id: string;
  category: string;
  item: string;
  supplier: string;
  budgeted: number;
  actual: number;
  paymentMethod: string;
  installments: number;
  paymentDates: string[];
  status: 'paid' | 'pending';
  notes: string;
}

export interface Project {
  id: string;
  name: string;
  date: string;
  location: string;
  type: string;
  guestCount: number;
  budgetRange: string;
  styleTags: string[];
  keywords: string[];
  restrictions: string[];
  status: ProjectStatus;
  environments: Environment[];
  assets: Asset[];
  moodboards: Moodboard[];
  crest?: Crest;
  briefingTranscript?: string;
  briefingDirectives?: Directives;
  production: {
    checklist: ProductionChecklistItem[];
    timeline: ProductionTimelineItem[];
    budget: BudgetItem[];
  };
}
