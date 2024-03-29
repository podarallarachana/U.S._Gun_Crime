import React from 'react';
import axios from 'axios';
import { Select } from 'antd';
import { primaryBlue, darkerPurple } from '../DataVisualizations/chartColors';
import HorizontalBarGraph from './HorizontalBarGraph';
import * as chartjs from 'chart.js';
import { ChartData } from 'react-chartjs-2';

interface DeadliestStatesState {
  currentYear: string;
  isLoading: boolean;
  stateLabels: string[];
  data: ChartData<chartjs.ChartData>;
}

const years = ['2013', '2014', '2015', '2016', '2017', '2018'];

class DeadliestStates extends React.Component<{}, DeadliestStatesState> {
  public constructor(props: {}) {
    super(props);
    this.state = {
      currentYear: '2013',
      isLoading: true,
      stateLabels: [],
      data: {
        labels: [],
        datasets: [
          {
            label: '',
            backgroundColor: '',
            data: [],
          },
        ],
      },
    };
  }

  public componentDidMount() {
    this.fetchDeadliestStatesData();
  }

  private fetchDeadliestStatesData = async () => {
    try {
      const response = await axios.get(
        `/api/location/deadliestStates/${this.state.currentYear}`
      );

      const deathsPerCapita: number[] = [];
      const stateLabels: string[] = [];

      response.data.forEach((state: { STATE: string; N_KILLED: number }) => {
        deathsPerCapita.push(state.N_KILLED);
        stateLabels.push(state.STATE);
      });

      this.setState({
        ...this.state,
        isLoading: false,
        data: {
          labels: stateLabels,
          datasets: [
            {
              label: 'Deaths per capita (scaled up)',
              backgroundColor: darkerPurple,
              data: deathsPerCapita,
            },
          ],
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  public onYearChange = (value: string) => {
    this.setState(
      {
        isLoading: true,
        currentYear: value,
        data: {
          labels: [],
          datasets: [
            {
              label: '',
              backgroundColor: '',
              data: [],
            },
          ],
        },
      },
      () => {
        this.fetchDeadliestStatesData();
      }
    );
  };

  public render() {
    const { currentYear } = this.state;
    return (
      <HorizontalBarGraph
        isLoading={this.state.isLoading}
        data={this.state.data}
        showxAxisTicks={false}
        showTooltips={false}
      >
        Year:{' '}
        <Select
          defaultValue={currentYear}
          onChange={this.onYearChange}
          showSearch={false}
          style={{ width: 100 }}
          disabled={this.state.isLoading}
        >
          {years.map((item, index) => (
            <Select.Option value={item} key={index}>
              {item}
            </Select.Option>
          ))}
        </Select>
      </HorizontalBarGraph>
    );
  }
}

export default DeadliestStates;
