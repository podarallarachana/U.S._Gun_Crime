import React from 'react';
import axios from 'axios';
import { Line, ChartData } from 'react-chartjs-2';
import { Card } from 'antd';
import { Select } from 'antd';
import states from '../StateComparisons/states';
import LoadingSpin from '../../../../components/LoadingSpin/LoadingSpin';
import * as chartjs from 'chart.js';

interface TrendsToolProps {
  className: string;
}

interface TrendsToolState {
  state: string;
  gender: string;
  genders: string[];
  isLoading: boolean;
  data: ChartData<chartjs.ChartData>;
}

class TrendsTool extends React.Component<TrendsToolProps, TrendsToolState> {
  public constructor(props: TrendsToolProps) {
    super(props);
    this.state = {
      genders: ['Male', 'Female'],
      gender: 'Male',
      state: states[0],
      isLoading: true,
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
    this.fetchTrendsToolData();
  }

  private fetchTrendsToolData = async () => {
    try {
      const response1 = await axios.get(
        `/api/location/${this.state.state}/deathsPerYear`
      );

      const deathsPerYear1: number[] = [];
      response1.data.forEach((p: { DEATHS: number }) =>
        deathsPerYear1.push(p.DEATHS)
      );

      this.setState({
        ...this.state,
        isLoading: false,
        data: {
          labels: ['2013', '2014', '2015', '2016', '2017', '2018'],
          datasets: [
            {
              label: 'Gun deaths by year in ' + this.state.state,
              backgroundColor: 'rgba(247, 143, 76, 0.2)',
              data: deathsPerYear1,
            },
          ],
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  public onStateChange = (value: string) => {
    this.setState(
      {
        state: value,
        isLoading: true,
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
        this.fetchTrendsToolData();
      }
    );
  };

  public render() {
    const { state } = this.state;
    const { gender } = this.state;
    return (
      <section className={this.props.className}>
        <Card title="Trends Tool">
          <div style={{ marginBottom: '20px' }}>
            <Select
              defaultValue={state}
              onChange={this.onStateChange}
              showSearch={true}
              style={{ width: 150 }}
            >
              {states.map((item, index) => (
                <Select.Option value={item} key={`${index}1`}>
                  {item}
                </Select.Option>
              ))}
            </Select>
            &nbsp;&nbsp;
            <Select
              defaultValue={gender}
              showSearch={true}
              style={{ width: 150 }}
            >
              {this.state.genders.map((item, index) => (
                <Select.Option value={item} key={`${index}1`}>
                  {item}
                </Select.Option>
              ))}
            </Select>
          </div>
          <LoadingSpin spinning={this.state.isLoading}>
            <Line
              options={{
                responsive: true,
              }}
              data={this.state.data}
              redraw={true}
            />
          </LoadingSpin>
        </Card>
      </section>
    );
  }
}

export default TrendsTool;
