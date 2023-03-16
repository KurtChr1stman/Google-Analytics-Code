import React, { useEffect, useState } from "react";
import { Row, Card, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import googleAnalyticsService from "../../../../services/googleAnalyticsService";
import ApexCharts from "../ApexCharts";
import { formatDateInput } from "utils/dateFormater";
import { ActiveUserChartOptions } from "components/dashboard/analytics/ChartData";
import sabioDebug from "sabio-debug";
const _logger = sabioDebug.extend("Analytics");

const AverageUsersGraph = React.memo(function AverageUsersGraph({
  startDateInfo,
  endDateInfo,
}) {
  const [googleAnalyticsQuery] = useState({
    metrics: [
      {
        expression: "ga:1dayUsers",
        formattingType: "INTEGER",
      },
    ],
    dimensions: [
      {
        name: "ga:date",
      },
    ],
  });
  const [thirtyDayQuery] = useState({
    metrics: [
      {
        expression: "ga:30dayUsers",
        formattingType: "INTEGER",
      },
    ],
    dimensions: [
      {
        name: "ga:date",
      },
    ],
  });
  const [sevenDayQuery] = useState({
    metrics: [
      {
        expression: "ga:7dayUsers",
        formattingType: "INTEGER",
      },
    ],
    dimensions: [
      {
        name: "ga:date",
      },
    ],
  });

  const [pageData, setPageData] = useState({
    AverageUsersByDay: [],
    AverageUsersDataArray: [{ data: [] }],
    AverageUsersTotal: 0,
  });

  const [sevenDayData, setSevenDayData] = useState({ total: 0 });
  const [thirtyDayData, setThirtyDayData] = useState({ total: 0 });

  useEffect(() => {
    let oneDayPayload = { ...googleAnalyticsQuery };
    oneDayPayload.startDate = startDateInfo;
    oneDayPayload.endDate = endDateInfo;
    googleAnalyticsService
      .addSiteData(oneDayPayload)
      .then(onSiteDataSuccess)
      .then(thirtyDayCall)
      .then(sevenDayCall)
      .catch(onSiteDataError);
  }, [startDateInfo, endDateInfo]);

  const thirtyDayCall = () => {
    let thirtyDayPayload = { ...thirtyDayQuery };
    thirtyDayPayload.startDate = startDateInfo;
    thirtyDayPayload.endDate = endDateInfo;
    googleAnalyticsService
      .addSiteData(thirtyDayPayload)
      .then(onThirtyDataSuccess)
      .catch(onThirtyDataError);
  };
  const sevenDayCall = () => {
    let sevenDayPayload = { ...sevenDayQuery };
    sevenDayPayload.startDate = startDateInfo;
    sevenDayPayload.endDate = endDateInfo;
    googleAnalyticsService
      .addSiteData(sevenDayPayload)
      .then(onSevenDataSuccess)
      .catch(onSevenDataError);
  };

  const onSiteDataSuccess = (res) => {
    const startDateArray = startDateInfo.split("-");
    const endDateArray = endDateInfo.split("-");
    const newStartDate = `${startDateArray[1]}-${startDateArray[2]}-${startDateArray[0]}`;
    const newEndDate = `${endDateArray[1]}-${endDateArray[2]}-${endDateArray[0]}`;

    const dateStart = new Date(newStartDate);
    const dateEnd = new Date(newEndDate);
    const dateMath = Math.round((dateEnd - dateStart) / (1000 * 60 * 60 * 24));
    const arr = new Array(dateMath + 1).fill(0);
    const dateDataArray = [];

    for (var i = 0; i < dateMath + 1; i++) {
      var newDate = new Date(newStartDate);
      newDate.setDate(newDate.getDate() + i);
      dateDataArray.push(formatDateInput(newDate));
    }

    let responseData = res.reports[0].data.rows
      ? res.reports[0].data?.rows
      : [];

    setPageData(() => {
      const pd = { ...pageData };
      pd.AverageUsersByDay = responseData;
      pd.AverageUsersTotal = res.reports[0].data.totals[0].values[0];
      pd.AverageUsersByDay.map(mapUserData);
      pd.AverageUsersDataArray = [{ data: arr }];
      return pd;
    });

    const mapUserData = (data) => {
      const year = data.dimensions[0].substring(0, 4);
      const month = data.dimensions[0].substring(4, 6);
      const day = data.dimensions[0].substring(6, 8);
      const newDate = `${year}-${month}-${day}`;
      for (let i = 0; i < dateDataArray.length; i++) {
        const element = dateDataArray[i];
        if (newDate === element) {
          const dateNumber = parseInt(data.metrics[0].values[0]);
          arr.splice(i, 1, dateNumber);
        }
      }
    };
  };

  const onThirtyDataSuccess = (res) => {
    setThirtyDayData(() => {
      const newData = { ...thirtyDayData };
      newData.total = res.reports[0].data.totals[0].values[0];
      return newData;
    });
  };
  const onSevenDataSuccess = (res) => {
    setSevenDayData(() => {
      const newData = { ...sevenDayData };
      newData.total = res.reports[0].data.totals[0].values[0];
      return newData;
    });
  };

  const onSiteDataError = (err) => {
    _logger("this is Err for 1day in AverageUsersGraph", err);
  };
  const onThirtyDataError = (err) => {
    _logger("this is Err for 30day in AverageUsersGraph", err);
  };
  const onSevenDataError = (err) => {
    _logger("this is Err for 7day in AverageUsersGraph", err);
  };

  return (
    <Col xl={4} lg={12} md={12} className="mb-4">
      <Card className="h-100">
        <Card.Header className="align-items-center card-header-height d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Active User</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col>
              <span className="fw-semi-bold">30 days</span>
              <h1 className="fw-bold mt-2 mb-0 h2">{thirtyDayData.total}</h1>
              <p className="text-success fw-semi-bold mb-0"></p>
            </Col>
            <Col>
              <span className="fw-semi-bold">7 days</span>
              <h1 className="fw-bold mt-2 mb-0 h2">{sevenDayData.total}</h1>
              <p className="text-danger fw-semi-bold mb-0">
                <i className="fe fe-trending-down me-1"></i>4.6%
              </p>
            </Col>
            <Col>
              <span className="fw-semi-bold">1 days</span>
              <h1 className="fw-bold mt-2 mb-0 h2">
                {pageData.AverageUsersTotal}
              </h1>
              <p className="text-success fw-semi-bold mb-0">
                <i className="fe fe-trending-up me-1"></i>4.6%
              </p>
            </Col>
          </Row>
          <ApexCharts
            options={ActiveUserChartOptions}
            series={pageData.AverageUsersDataArray}
            type="bar"
          />
        </Card.Body>
      </Card>
    </Col>
  );
});

AverageUsersGraph.propTypes = {
  startDateInfo: PropTypes.string.isRequired,
  endDateInfo: PropTypes.string.isRequired,
};

export default AverageUsersGraph;
