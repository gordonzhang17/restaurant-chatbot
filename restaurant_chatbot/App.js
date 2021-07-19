// App.js
import React, { Component } from 'react';
import { View, } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';

// Dialogflow config files
import { Dialogflow_V2 } from 'react-native-dialogflow';
import { dialogflowConfig } from './env';

const axios = require('axios');

const BOT = {
  _id: 2,
  name: 'Restaurant Finder Bot',
  avatar: 'https://images.emojiterra.com/google/android-11/512px/1f916.png'
};

class App extends Component {
  state = {
    messages: [
      {
        _id: 1,
        text: `Hi! I'm here to help you find a place to eat today for ${this.timeofDay()}. \n\nWhat would you like to eat?`,
        createdAt: new Date(),
        user: BOT,
      }
    ],
    cuisine: null,
    address: null,
  };

  timeofDay() {
    let date = new Date();
    let time = date.getHours();

    if (time < 11) {
      return "breakfast";
    } else if (time > 11 && time < 14) {
      return "lunch";
    } else {
      return "dinner";
    }

  }

  onSend(messages = []) {

    this.setState(prevState => ({
      messages: GiftedChat.append(prevState.messages, messages)
    }));

    const message = messages[0].text;

    Dialogflow_V2.requestQuery(
      message,
      resultCallback => this.handleDialogflowResponse(resultCallback),
      errorCallback => console.log(errorCallback) 
    )
  }

  handleDialogflowResponse(response) {

    if (response.error !== null) {
      const text = response.queryResult.fulfillmentMessages[0].text.text[0];
      const parameters = response.queryResult.parameters;

      this.checkAndSetCuisine(parameters);
      this.checkAndSetAddress(parameters);
      this.checkConfirmedAddress(parameters);

      this.sendBotResponse(text);
      
    } else {
      console.log("error in handleDialogflowResponse");
    }
  }

  checkAndSetCuisine(parameters) {
    if (parameters.Cuisine !== undefined) {
      this.setState((prevState) => ({
        cuisine: parameters.Cuisine
      }))
    }
  }

  checkAndSetAddress(parameters) {
    if (parameters.address !== undefined) {
      this.setState((prevState) => ({
        address: parameters.address
      }))
    }
  }

  checkConfirmedAddress(parameters) {

    if (parameters.hasConfirmedAddress === "true") {
      this.fetchRestaurants();
    }
  }

  sendBotResponse(text) {

    let message = {
      _id: this.state.messages.length + 1,
      text,
      createdAt: new Date(),
      user: BOT
    }

    this.setState(prevState => ({
      messages: GiftedChat.append(prevState.messages, [message])
    }));

  }

   async fetchRestaurants() {

    const URL = 'https://u6rhu3taj2.execute-api.us-east-1.amazonaws.com/dev/fetchRestaurants';
    //note. using android emulator, you cannot use localhost as address. must use this

    if (this.state.address !== null && this.state.cuisine !== null) {
      
      await axios({
        method: 'get',
        url: URL,
        params: {
          cuisine: this.state.cuisine,
          address: this.state.address,
        }
      
      }).then((res) => {

        let results = res.data.restaurants;

        let parsedRestaurants = [];

        for (let i = 0 ; i < results.length; i++) {

          let result = results[i];
                
            const name = result.name;
            const formattedAddress = result.formattedAddress;
            const isOpenNow = result.isOpenNow === true ? true : false;
            const rating = result.rating;
            
            const restaurant = {
              name: name, 
              formattedAddress: formattedAddress, 
              isOpenNow: isOpenNow, 
              rating: rating
            };
  
            parsedRestaurants.push(restaurant);
        }
        
        this.sendBotResponse(this.createRestaurantsMessage(parsedRestaurants));
  
      }).catch((error) => {
        console.log(error);
      })

    }
  };

  createRestaurantsMessage(parsedRestaurants) {

    let messageText = "Here are some restaurants: \ \n";

    for (let i = 0; i < parsedRestaurants.length; i++) {

      const restaurant = parsedRestaurants[i];

      const name = restaurant.name;
      const formattedAddress = restaurant.formattedAddress;
      const isOpenNow = restaurant.isOpenNow ? "Yes": "No";
      const rating = restaurant.rating; 

      messageText = messageText + 
      `name: ${name} \nAddress: ${formattedAddress}\nIs Opened Now?: ${isOpenNow}\nRating: ${rating}` + "\n\n"

    }

    return messageText + "Have a delicious meal and good bye!"

  }
  

  componentDidMount() {
    Dialogflow_V2.setConfiguration(
      dialogflowConfig.client_email,
      dialogflowConfig.private_key,
      Dialogflow_V2.LANG_ENGLISH,
      dialogflowConfig.project_id,
    );
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <GiftedChat
          messages={this.state.messages}
          onSend={messages => this.onSend(messages)}
          user={{
            _id: 1
          }}
        />
      </View>
    );
  }
}

export default App;