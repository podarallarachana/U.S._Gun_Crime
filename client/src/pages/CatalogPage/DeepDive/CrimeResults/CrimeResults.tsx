import React from 'react';
import { GunCrime } from 'pages/CatalogPage/GunCrime';
import { Statistic, List, Icon, Result, Modal } from 'antd';
import CrimeCard from '../CrimeCard/CrimeCard';
import moment from 'moment';
import { DATE_FORMAT } from '../DateFormat';
import axios from 'axios';
import styles from './CrimeResults.module.less';
import Gun from './Gun';
import Participant from './Participant';
import LoadingSpin from 'components/LoadingSpin/LoadingSpin';

// TODO: maybe extract the modal into its own component
interface CrimeResultsState {
  detailsModalVisible: boolean;
  detailsModalID: number;
  detailsModalParticipants: Participant[];
  waitingForParticipantData: boolean;
  detailsModalGuns: Gun[];
  waitingForGunData: boolean;
}

interface CrimeResultsProps {
  gunCrimes: GunCrime[];
  dataFetchFailed: boolean;
}

class CrimeResults extends React.Component<
  CrimeResultsProps,
  CrimeResultsState
> {
  public constructor(props: CrimeResultsProps) {
    super(props);
    this.state = {
      detailsModalVisible: false,
      detailsModalID: -1,
      detailsModalParticipants: [],
      waitingForParticipantData: false,
      detailsModalGuns: [],
      waitingForGunData: false,
    };
  }

  private showCrimeDetails = async (id: number) => {
    this.setState({
      ...this.state,
      detailsModalID: id,
      detailsModalVisible: true,
      waitingForParticipantData: true,
      waitingForGunData: true,
    });

    try {
      const participants = await axios.get(`/api/incident/${id}/participants`);
      const guns = await axios.get(`/api/incident/${id}/guns`);

      this.setState({
        ...this.state,
        waitingForParticipantData: false,
        waitingForGunData: false,
        detailsModalParticipants: participants.data,
        detailsModalGuns: guns.data,
      });
    } catch (error) {}
  };

  private renderCrimeCard = (crime: GunCrime) => {
    return (
      <CrimeCard
        title={`#${crime.INCIDENT_ID} on ${moment(crime.INCIDENT_DATE).format(
          DATE_FORMAT
        )}`}
        key={crime.INCIDENT_ID}
        launchDetailsModal={this.showCrimeDetails}
        {...crime}
      />
    );
  };

  public render() {
    return (
      <section>
        {this.props.gunCrimes.length !== 0 ? (
          <section className={styles.statistics}>
            <h2>Statistics at a Glance:</h2>
            <div className={styles.statisticGrid}>
              <Statistic
                title="Total # of crimes"
                value={this.props.gunCrimes.length}
              />
              <Statistic
                title="Total killed"
                value={this.props.gunCrimes.reduce(
                  (acc, { N_KILLED }) => acc + N_KILLED,
                  0
                )}
              />
              <Statistic
                title="Total injured"
                value={this.props.gunCrimes.reduce(
                  (acc, { N_INJURED }) => acc + N_INJURED,
                  0
                )}
              />
              <Statistic
                title="Total # of guns involved"
                value={this.props.gunCrimes.reduce(
                  (acc, { N_GUNS_INVOLVED }) => acc + N_GUNS_INVOLVED,
                  0
                )}
              />
            </div>
          </section>
        ) : null}
        <Modal
          visible={this.state.detailsModalVisible}
          title={`Details for incident #${this.state.detailsModalID}`}
          destroyOnClose={true}
        >
          <section>
            <h4>Participants involved:</h4>
            {this.state.waitingForParticipantData ? (
              <LoadingSpin />
            ) : (
              this.state.detailsModalParticipants.map((p: Participant) => {
                return (
                  <p>
                    Name: {p.NAME} Age: {p.AGE} Gender: {p.GENDER} Type:{' '}
                    {p.TYPE} Status: {p.STATUS} Relationship: {p.RELATIONSHIP}{' '}
                  </p>
                );
              })
            )}
          </section>
          <section>
            <h4>Guns involved:</h4>
            {this.state.waitingForGunData ? (
              <LoadingSpin />
            ) : (
              this.state.detailsModalGuns.map((g: Gun) => {
                return (
                  <p>
                    Type: {g.TYPE} Stolen:{' '}
                    {g.STOLEN === 1 ? 'Yes' : g.STOLEN === 0 ? 'No' : 'Unknown'}
                  </p>
                );
              })
            )}
          </section>
        </Modal>
        <List
          pagination={{ showSizeChanger: true, showQuickJumper: true }}
          dataSource={this.props.gunCrimes}
          renderItem={this.renderCrimeCard}
          locale={{
            emptyText: (
              <Result
                icon={<Icon type="frown" />}
                title={
                  this.props.dataFetchFailed
                    ? 'Failed to fetch data'
                    : 'No matching results'
                }
                subTitle={
                  this.props.dataFetchFailed
                    ? `This may be due to a connection issue, or maybe 
                there's too much data to return. Try applying more filters.`
                    : 'Try tweaking your search parameters'
                }
              />
            ),
          }}
        />
      </section>
    );
  }
}

export default CrimeResults;
