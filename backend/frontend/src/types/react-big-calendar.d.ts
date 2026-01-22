// src/types/react-big-calendar.d.ts
// Declaração de tipos mínima para react-big-calendar
// Resolve o erro: "Could not find a declaration file for module 'react-big-calendar'"

declare module 'react-big-calendar' {
  import { ComponentType, ReactNode } from 'react';

  export type NavigateAction = 'PREV' | 'NEXT' | 'TODAY' | 'DATE';

  export interface Event {
    title?: ReactNode;
    start?: Date;
    end?: Date;
    allDay?: boolean;
    resource?: any;
    [key: string]: any;
  }

  export interface CalendarProps<TEvent = Event, TResource = any> {
    localizer: any;
    events?: TEvent[];
    startAccessor?: string | ((event: TEvent) => Date);
    endAccessor?: string | ((event: TEvent) => Date);
    style?: React.CSSProperties;
    className?: string;
    views?: any;
    defaultView?: string;
    selectable?: boolean;
    date?: Date;
    onSelectSlot?: (slotInfo: any) => void;
    onSelectEvent?: (event: TEvent) => void;
    onNavigate?: (newDate: Date, view: string, action: NavigateAction) => void;
    eventPropGetter?: (event: TEvent) => any;
    components?: any;
    messages?: any;
    [key: string]: any;
  }

  export const Calendar: ComponentType<CalendarProps>;

  export const momentLocalizer: (momentInstance: any) => any;

  export const Views: {
    MONTH: string;
    WEEK: string;
    DAY: string;
    AGENDA: string;
    WORK_WEEK: string;
  };
}

declare module 'react-big-calendar/lib/css/react-big-calendar.css' {
  const styles: any;
  export default styles;
}