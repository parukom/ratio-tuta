declare module 'react-apexcharts' {
  import React from 'react';
  import { ApexOptions } from 'apexcharts';
  export interface ReactApexChartProps<T = unknown> {
    type?: string;
    series?: T;
    options?: ApexOptions;
    width?: string | number;
    height?: string | number;
    className?: string;
  }
  export default class ReactApexChart extends React.Component<ReactApexChartProps> {}
}
