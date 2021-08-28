import React from 'react';
import { Jumbotron, Container, Button, Col, Row, Nav, Tab, Fade } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ME } from '../utils/queries';
import { REMOVE_CITY } from '../utils/mutations';
import { removeCityId } from '../utils/localStorage';
import Auth from '../utils/auth';
import { Bar } from 'react-chartjs-2'
import CityTable from '../components/Table';
import 'semantic-ui-css/semantic.min.css';
import { Card, Icon, Image, Statistic, Message } from 'semantic-ui-react'
import { Link } from 'react-router-dom';
import { numbersWithCommas } from '../utils/helpers'
import city from "../assets/images/city.jpg";


const Profile = () => {


  const { loading, data } = useQuery(QUERY_ME, { fetchPolicy: 'network-only' });
  console.log(data);
  const [removeCity] = useMutation(REMOVE_CITY);

  const userData = data?.me || {};
  console.log(userData);

  // if (!userData?.username) {
  //   return (
  //     <div className="p-5">
  //       <Message negative>
  //         <Message.Header>Additional privileges needed in order to view this page</Message.Header>
  //         <p>You must to be logged in to view this page. Use navigation links above to
  //           sign up or log in.</p>
  //       </Message>
  //     </div>
  //   );
  // }



  // create function that accepts the city's mongo _id value as param and deletes the book from the database
  const handleDeleteCity = async (cityId) => {
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    // remove city
    try {
      const response = await removeCity({
        variables: { cityId },
      });

      if (!response.data) {
        throw new Error('something went wrong!');
      }
      // upon success, remove city's id from localStorage
      removeCityId(cityId);
    } catch (err) {
      console.error(err);
    }
  };
  // if data isn't here yet, say so
  if (loading) {
    return <h2>LOADING...</h2>;
  }

  return (
    <>

      <Jumbotron fluid className="m-3">
        <Row>

          <Col className="mb-2 mt-3 about-me" sm={12} md={5}>
            <Container>
              <Card fluid>
                <Card.Content className="text-left">
                  <Card.Header className="mb-2"><h1>{data.me.username}</h1></Card.Header>
                  <Card.Meta className="mb-3">{data.me.email}</Card.Meta>
                  <Card.Meta className="mb-3">{data.me.homeCity &&
                    <h3>{data.me.username} is currently living in {data.me.homeCity.name.split(',')[0]}.</h3>}</Card.Meta>
                  {/* <Card.Description className="text-left">
                    {data.me.homeCity &&
                      <h3>{data.me.username} is currently living in {data.me.homeCity.name.split(',')[0]}.</h3>}

                  </Card.Description> */}

                </Card.Content>
                <Card.Content extra>
                  <div className="display-flex align-center ">
                    <Icon disabled name='building' size='large' />
                    <span>{data.me.savedCities.length}&nbsp;
                      {data.me.savedCities.length === 1 ? 'city' : 'cities'} saved</span>
                  </div>
                </Card.Content>
                {
                  data.me.homeCity &&
                  <Card.Content extra>
                    <div className="display-flex align-center mb-4">
                      <Icon disabled name='home' size='large' />
                      <span>{data.me.homeCity.name}</span>
                    </div>
                  </Card.Content>
                }

              </Card>
              {
                data.me.homeCity
                  ? <Card fluid className="mb-4">
                    <Image src={data.me.homeCity.image} wrapped ui={false} />
                    <Card.Content>
                      <Card.Meta className="mb-2">Home City</Card.Meta>
                      <Card.Header className="mb-4">{data.me.homeCity.name}</Card.Header>

                      <Card.Description >
                        <Statistic size="tiny">
                          <Statistic.Label >Population</Statistic.Label>
                          <Statistic.Value className="population mb-3">{numbersWithCommas(data.me.homeCity.population)}</Statistic.Value>
                        </Statistic>
                      </Card.Description>
                      {<Bar
                        data={{
                          labels: ['Healthcare', 'Taxation', 'Education', 'Housing', 'Living', 'Safety', 'Environment', 'Economy'],
                          datasets: [
                            {
                              label: 'Score',
                              data: [`${data.me.homeCity.healthcare}`, `${data.me.homeCity.taxation}`, `${data.me.homeCity.education}`, `${data.me.homeCity.housing}`, `${data.me.homeCity.costOfLiving}`, `${data.me.homeCity.safety}`, `${data.me.homeCity.environmentalQuality}`, `${data.me.homeCity.economy}`],

                              backgroundColor: [
                                'rgba(255, 99, 132, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(153, 102, 255, 0.2)',
                                'rgba(255, 206, 86, 0.2)',
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(255, 159, 64, 0.2)',
                                'rgba(223, 141, 243, 0.2)',
                                'rgba(82, 255, 94, 0.2)',
                              ],
                              borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(255, 159, 64, 1)',
                                'rgba(223, 141, 243, 1)',
                                'rgba(82, 255, 94, 1)',
                              ],
                              borderWidth: 1
                            }]
                        }}
                        height={70}
                        width={200}
                        options={
                          {
                            plugins: {
                              legend: {
                                display: false
                              }
                            },
                            responsive: true,
                            maintainAspectRatio: true,
                            scales: {
                              y: {
                                suggestedMin: 0,
                                suggestedMax: 5
                              }
                            }
                          }}
                      />}
                    </Card.Content>

                  </Card>
                  : <Link to="/"><Button variant="danger">Search for your home city</Button></Link>
              }

            </Container>

          </Col>
          <Col sm={12} md={7} className="mt-3">
            <Container className="data"> <h2 className="overview"> Saved City Overview</h2> {'\n'}
              <h3 className="overviewCity">  {userData.cityCount > 0 ? `Your ${userData.cityCount} Saved Cities!` : 'You have 0 saved cities.'} </h3>
            </Container>
            <Container className="scores">
              <h2> City Compare</h2>
              <CityTable />
            </Container>


            <Container className="scores">
              <Tab.Container className="" sm={12} id="left-tabs-example" >
                <Row >
                  <Col sm={12}>
                    <Tab.Content>
                      {userData.savedCities.map((city) => {
                        return (
                          <Tab.Pane eventKey={city.cityId} transition={Fade}>
                            <Row className="CityChartName">
                              <h3>{city.name}
                                <Button variant="outline-danger delete" size="sm" onClick={() => handleDeleteCity(city.cityId)}>
                                  Delete city
                                </Button></h3>

                            </Row>
                            {<Bar className="mb-3"
                              data={{
                                labels: ['Healthcare', 'Taxation', 'Education', 'Housing', 'Living', 'Safety', 'Environment', 'Economy'],
                                datasets: [
                                  {
                                    label: 'Score',
                                    data: [`${city.healthcare}`, `${city.taxation}`, `${city.education}`, `${city.housing}`, `${city.costOfLiving}`, `${city.safety}`, `${city.environmentalQuality}`, `${city.economy}`],

                                    backgroundColor: [
                                      'rgba(255, 99, 132, 0.2)',
                                      'rgba(54, 162, 235, 0.2)',
                                      'rgba(153, 102, 255, 0.2)',
                                      'rgba(255, 206, 86, 0.2)',
                                      'rgba(75, 192, 192, 0.2)',
                                      'rgba(255, 159, 64, 0.2)',
                                      'rgba(223, 141, 243, 0.2)',
                                      'rgba(82, 255, 94, 0.2)',
                                    ],
                                    borderColor: [
                                      'rgba(255, 99, 132, 1)',
                                      'rgba(54, 162, 235, 1)',
                                      'rgba(153, 102, 255, 1)',
                                      'rgba(255, 206, 86, 1)',
                                      'rgba(75, 192, 192, 1)',
                                      'rgba(255, 159, 64, 1)',
                                      'rgba(223, 141, 243, 1)',
                                      'rgba(82, 255, 94, 1)',
                                    ],
                                    borderWidth: 1
                                  }]
                              }}
                              height={60}
                              width={200}
                              options={
                                {
                                  plugins: {

                                    legend: {
                                      display: false
                                    }
                                  },
                                  responsive: true,
                                  maintainAspectRatio: true,
                                  scales: {
                                    y: {
                                      suggestedMin: 0,
                                      suggestedMax: 5
                                    }
                                  }
                                }}
                            />}

                          </Tab.Pane>)
                      })}
                    </Tab.Content>

                  </Col>
                  <Col sm={12} className="display-flex flex-wrap">
                    {userData.savedCities.map((city) => {
                      return (
                        <Nav key={city.cityId} defaultActiveKey={city.cityId} variant="pills"  >
                          <Nav.Item >
                            <Nav.Link className="p-2 pb-2" eventKey={city.cityId}> {city.name}</Nav.Link>
                          </Nav.Item>
                        </Nav>)
                    })}
                  </Col>

                </Row>
              </Tab.Container>

            </Container>

          </Col>

        </Row>
      </Jumbotron>
    </>
  );
};

export default Profile;