import React, { useState, useEffect } from 'react';
import { searchCityData, searchBlank } from '../utils/API';
import { useMutation, useQuery } from '@apollo/client';
import { SAVE_CITY, SAVE_HOME_CITY } from '../utils/mutations';
import { QUERY_ME } from '../utils/queries';
import { numbersWithCommas } from '../utils/helpers'
import { Jumbotron, Form } from 'react-bootstrap';
import Auth from '../utils/auth';
import { Bar } from 'react-chartjs-2';
import { faSearch, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import AutoSearch from '../components/AutoSearch';
import { Container, Button, Grid, Message, Statistic, Progress } from 'semantic-ui-react';
import CityNames from '../utils/Cities';
import BannerIntro from "../components/BannerIntro";





const Search = () => {
  const [searching, setSearching] = useState(false);
  const [validSearch, validateSearch] = useState(true);
  const { loading, error, data } = useQuery(QUERY_ME, {});
  console.log(error);
  console.log(data);

  const [searchedCities, setSearchedCities] = useState([]);
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState('');

  const [savedCityIds, setSavedCityIds] = useState([]);

  // set up useEffect hook to save `savedCityIds` list to localStorage on component unmount
  useEffect(() => {
    if (!loading && data?.me?.savedCities) {
      const cityIds = data.me.savedCities.map(({ cityId }) => cityId)
      //console.log("saved city ids from db --- ", cityIds)
      setSavedCityIds(cityIds)
    }
  }, [loading]);

  // set mutation for saving City


  const [saveHomeCity, { saveHomeError }] = useMutation(SAVE_HOME_CITY);

  const [saveCity] = useMutation(SAVE_CITY
  );

  const SuggestionsList = props => {
    const {
      suggestions,
      searchInput,
      onSelectSuggestion,
      displaySuggestions,
      selectedSuggestion,
      onKeyDown

    } = props;

    if (searchInput && displaySuggestions) {
      if (suggestions.length > 0) {
        return (

          <ul className="suggestions-list">
            {suggestions.map((suggestion, index) => {
              const isSelected = selectedSuggestion === index;
              const classname = `suggestion ${isSelected ? "selected" : ""}`;

              return (
                <li
                  tabIndex={0}
                  key={index}
                  className={classname}
                  onClick={() => onSelectSuggestion(index)}
                  onKeyDown={onKeyDown}

                >
                  {suggestion}
                </li>

              );
            })}
          </ul>
        );
      } else {
        return <div className="no-suggestions"> <FontAwesomeIcon icon={faExclamationTriangle} />&nbsp;&nbsp;No suggestions available</div>;
      }
    }
    return <></>;
  };


  const [filteredSuggestions, setFilteredSuggestions] = React.useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = React.useState(0);
  const [displaySuggestions, setDisplaySuggestions] = React.useState(false);


  const suggestions = CityNames();

  const onChange = event => {
    const value = event.target.value;
    setSearchInput(value);

    const filteredSuggestions = suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredSuggestions(filteredSuggestions);
    setDisplaySuggestions(true);

  };

  const onSelectSuggestion = index => {
    setSelectedSuggestion(index);
    setSearchInput(filteredSuggestions[index]);
    setFilteredSuggestions([]);
    setDisplaySuggestions(false);


  };





  // create method to search for city and set state on form submit
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    try {
      // perform API call to teleport
      const response = await searchCityData(searchInput);


      if (!response.ok) {
        throw new Error('something went wrong!');
      }

      // get returned data store to variable to pass into the useState hook
      const cityList = await response.json();
      const cityData = cityList._embedded['city:search-results'];
      console.log(cityData);
      // storing the population data as it also lives in an embedded directory
      const pop = cityData[0]._embedded["city:item"].population;
      cityData[0]['population'] = numbersWithCommas(pop);


      if (cityData[0]._embedded["city:item"]._embedded === undefined) {
        validateSearch(false);
        setSearchInput('');
      } else {
        // store the category data into an array
        const uaScores = cityData[0]._embedded["city:item"]._embedded["city:urban_area"]._embedded["ua:scores"].categories;
        cityData[0].housing = Math.round(uaScores[0].score_out_of_10);
        cityData[0].costOfLiving = Math.round(uaScores[1].score_out_of_10);
        cityData[0].safety = Math.round(uaScores[7].score_out_of_10);
        cityData[0].healthcare = Math.round(uaScores[8].score_out_of_10);
        cityData[0].education = Math.round(uaScores[9].score_out_of_10);
        cityData[0].environmentalQuality = Math.round(uaScores[10].score_out_of_10);
        cityData[0].economy = Math.round(uaScores[11].score_out_of_10);
        cityData[0].taxation = Math.round(uaScores[12].score_out_of_10);
        cityData[0].cityId = cityData[0]._embedded["city:item"].geoname_id;
        // store the link for the image in a variable 
        const regionLink = cityData[0]._embedded["city:item"]._embedded["city:urban_area"]._links["ua:images"].href;
        // API call to retrieve the image link
        const getImageResponse = await searchBlank(regionLink);
        if (!getImageResponse.ok) {
          throw new Error('something went wrong!');
        }
        const regionImage = await getImageResponse.json();
        // get the image link and store the string value in the cityData object 
        const imageLink = regionImage.photos[0].image.web;
        cityData[0]['image'] = imageLink;



        const regionName = cityData[0]._embedded["city:item"]._embedded["city:urban_area"].full_name;
        cityData[0]['region'] = regionName;

        validateSearch(true);
        setSearching(true);
        // Update the hook and empty the search field
        setSearchedCities(cityData);
        // setSearchedChart(cityData);
        setSearchInput('');


      }



    } catch (err) {
      console.error(err);
    }
  };
  const homeCityEqualsCurrent = (homeCity, city) => {
    //checks if current search result is saved as the users home city
    if (homeCity === null) {
      return false;
    }
    else {
      //console.log('home city', homeCity);
      //console.log('city',city);
      if (homeCity.name === city.matching_full_name) {
        return true;
      } else {
        return false;
      }
    }
  }
  const handleSaveHomeCity = async (cityId) => {
    const cityToSave = searchedCities.find((city) => city.cityId === cityId);
    //console.log('setting as home city', cityToSave);
    const token = Auth.loggedIn() ? Auth.getToken() : null;
    if (!token) {
      return false;
    }
    try {
      const cityData = {
        cityId: cityToSave._embedded["city:item"].geoname_id,
        name: cityToSave.matching_full_name,
        healthcare: cityToSave.healthcare,
        taxation: cityToSave.taxation,
        education: cityToSave.education,
        costOfLiving: cityToSave.costOfLiving,
        housing: cityToSave.housing,
        safety: cityToSave.safety,
        environmentalQuality: cityToSave.environmentalQuality,
        economy: cityToSave.economy,
        image: cityToSave.image,
        region: cityToSave.region,
        population: parseInt(cityToSave.population.replace(/,/g, ''), 10)
      }
      console.log(cityData);
      const response = await saveHomeCity({
        variables: { homeCity: cityData },
      });
      console.log('save home error', saveHomeError);
      if (!response.data) {
        throw new Error('something went wrong!');
      }
      const btn = document.getElementById('saveHomeCityBtn')
      btn.innerHTML = 'City is your Home City';
      btn.setAttribute('disabled', true);
    } catch (err) {
      console.error(err);
    }
  }

  const handleSaveCity = async (cityId) => {

    // find the city in `searchedcities` state by the matching id
    const cityToSave = searchedCities.find((city) => city.cityId === cityId);

    // get token
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    // save city
    try {
      console.log(cityToSave);
      const cityData = {
        cityId: cityToSave._embedded["city:item"].geoname_id,
        name: cityToSave.matching_full_name,
        healthcare: cityToSave.healthcare,
        taxation: cityToSave.taxation,
        education: cityToSave.education,
        costOfLiving: cityToSave.costOfLiving,
        housing: cityToSave.housing,
        safety: cityToSave.safety,
        environmentalQuality: cityToSave.environmentalQuality,
        economy: cityToSave.economy,
        image: cityToSave.image,
        region: cityToSave.region,

        //change population(which has commas) into an integer
        population: parseInt(cityToSave.population.replace(/,/g, ''), 10)

      }

      const response = await saveCity({
        variables: { city: cityData },
      });
      console.log(saveCity);


      if (!response.data) {
        throw new Error('something went wrong!');
      }

      setSavedCityIds([...savedCityIds, cityData.cityId]);
      const btn = document.getElementById('saveCityBtn')
      btn.innerHTML = 'This city has already been saved!';
      btn.setAttribute('disabled', true);
    } catch (err) {
      console.error(err);
    }
  };



  return (
    <>

      <Jumbotron fluid className='text-light jumboGrad home-search'>


        <Container
          // onClick={() => setDisplaySuggestions(false)}
          style={{ width: '70rem' }} className='p-5 jumbo'>

          <Form className='p-5' onSubmit={handleFormSubmit}>
            <h1 className="text-center font-normal">Search for your future <span className="home-city">home city</span></h1>

            <Form.Row >
              <Form.Label className="text-left display-block">City, State </Form.Label>
              <div className="input-group">
                <Form.Control

                  size="lg"
                  className="user-input form-control-large"
                  type="text"
                  onChange={onChange}
                  value={searchInput}
                  placeholder='Enter city name'
                />
                <SuggestionsList
                  onBlur={() => (alert("blur"), setDisplaySuggestions(false))}

                  searchInput={searchInput}
                  selectedSuggestion={selectedSuggestion}
                  onSelectSuggestion={onSelectSuggestion}
                  displaySuggestions={displaySuggestions}
                  suggestions={filteredSuggestions}
                />


                <Button light="true" type='submit'>
                  <FontAwesomeIcon icon={faSearch} /><span>&nbsp;&nbsp;Search</span>
                </Button>
              </div>
            </Form.Row></Form>
        </Container>

      </Jumbotron>


      <Container className='p-5'>

        {validSearch ? (searchedCities.map(city => {
          //console.log(city);

          //disabled save city button if logged in and search result is already saved

          return <div key={city.matching_full_name}>



            <div className="header-row">
              <div>
                <h2>
                  {city.matching_full_name}
                </h2>
                <h3>
                  Region {city.region}
                </h3>
              </div>
              {Auth.loggedIn() ? (<div></div>) :
                (
                  <div className="sign-info">
                    <Message
                      info
                      content="Sign up or login using the link in the header for the ability to create a profile page and save cities to compare."
                    />
                  </div>
                )
              }
              <div className="mb-4">
                {

                  Auth.loggedIn() &&
                  <Button primary
                    disabled={savedCityIds.includes(city.cityId + '') || savedCityIds.includes(city.cityId)}
                    className='btn-block btn-info'
                    id="saveCityBtn"
                    onClick={() => handleSaveCity(city.cityId)}>
                    {savedCityIds.includes(city.cityId + '') || savedCityIds.includes(city.cityId)
                      ? 'City has been saved'
                      : 'Save this City'}
                  </Button>


                }


                {
                  (Auth.loggedIn() && !loading && error === undefined) &&
                  <Button disabled={homeCityEqualsCurrent(data.me.homeCity, city)}
                    id="saveHomeCityBtn"
                    primary onClick={() => handleSaveHomeCity(city.cityId)}>
                    {homeCityEqualsCurrent(data.me.homeCity, city)
                      ? 'City is your Home City'
                      : 'Set as Home City'
                    }
                  </Button>

                }
              </div>
            </div>
            <Grid className="mb-4 mt-4 body-row" stackable columns={2}>
              <Grid.Column className="image-cropper">
                <img src={city.image} className="city-pic" alt="img not found"></img>
                <Statistic size='small'>
                  <Statistic.Label>Population</Statistic.Label>
                  <Statistic.Value>{city.population}</Statistic.Value>
                </Statistic>
              </Grid.Column>
              <Grid.Column>

                <div className="stats">
                  <span className="bold">Healthcare </span>
                  <Progress size='small' color='red' value={city.healthcare} total='10' progress='ratio' />
                </div>
                <div className="stats">
                  <span className="bold">Taxation </span>
                  <Progress size='small' color='blue' value={city.taxation} total='10' progress='ratio' />
                </div>

                <div className="stats">
                  <span className="bold">Education </span>
                  <Progress size='small' color='purple' value={city.education} total='10' progress='ratio' />
                </div>

                <div className="stats">
                  <span className="bold">Housing </span>
                  <Progress size='small' color='yellow' value={city.housing} total='10' progress='ratio' />
                </div>

                <div className="stats">
                  <span className="bold">Cost of Living </span>
                  <Progress size='small' color='teal' value={city.costOfLiving} total='10' progress='ratio' />
                </div>

                <div className="stats">
                  <span className="bold">Safety </span>
                  <Progress size='small' color='orange' value={city.safety} total='10' progress='ratio' />
                </div>

                <div className="stats">
                  <span className="bold">Environmental Quality </span>
                  <Progress size='small' color='violet' value={city.environmentalQuality} total='10' progress='ratio' />
                </div>

                <div className="stats">
                  <span className="bold">Economy </span>
                  <Progress size='small' color='green' value={city.economy} total='10' progress='ratio' />
                </div>


              </Grid.Column>
            </Grid>


            <Container className="mt-4 mb-4">
              <div className="mt-4">
                <Bar
                  data={{
                    labels: ['Healthcare', 'Taxation', 'Education', 'Housing', 'Living', 'Safety', 'Environment', 'Economy'],
                    datasets: [
                      {
                        label: 'Score',

                        data: [`${city.healthcare}`, `${city.taxation}`, `${city.education}`, `${city.housing}`, `${city.costOfLiving}`, `${city.safety}`, `${city.environmentalQuality}`, `${city.economy}`],

                        backgroundColor: [
                          'rgba(255, 99, 132, 0.2)',
                          'rgba(54, 162, 235, 0.2)',
                          'rgba(255, 206, 86, 0.2)',
                          'rgba(75, 192, 192, 0.2)',
                          'rgba(153, 102, 255, 0.2)',
                          'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                          'rgba(255, 99, 132, 1)',
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 206, 86, 1)',
                          'rgba(75, 192, 192, 1)',
                          'rgba(153, 102, 255, 1)',
                          'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                      }]

                  }}
                  height={350}
                  width={450}
                  options={{
                    plugins: {

                      legend: {
                        display: false
                      }
                    },
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        suggestedMin: 0,
                        suggestedMax: 10
                      }
                    }
                  }}
                />
              </div>


            </Container>
          </div>
        })) : (
          <Message negative>
            <Message.Header>No cities found</Message.Header>
            <p>Try searching for a different city.</p>
          </Message>
        )}

      </Container>

      {!searching && <BannerIntro />}
    </>
  );
};

export default Search;
