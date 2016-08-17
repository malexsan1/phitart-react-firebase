import React, {Component} from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import * as DB from './api/firebase'
import * as foods from './api/foodDb'

import Item from './components/Item'
import FoodItem from './components/FoodItem'
import FoodDetails from './components/FoodDetails'
import Authenticate from './components/Authenticate'
import {Nutrients, Units} from './api/constants'
import './App.css'

class App extends Component {
  constructor() {
    super()

    this.state = {
      searchedItems: [],
      detailedFood: null,
      userProfile: null
    };
    this.addPeople = this.addPeople.bind(this)
    this.getValues = this.getValues.bind(this)
    this.deleteItem = this.deleteItem.bind(this)
    this.auth = this.auth.bind(this)
    this.logout = this.logout.bind(this)
    this.addMeal = this.addMeal.bind(this)
    this.searchFood = this.searchFood.bind(this)
    this.getDetails = this.getDetails.bind(this)
  }

  componentWillMount() {
    DB.loggedUser(user => {
      let profileData = user.providerData[0]
      let profile = Object.assign(
        {},
        {
          displayName: profileData.displayName,
          photoUrl: profileData.photoURL,
          uid: user.uid
        }
      )
      if (user !== null) {
        this.setState({
          userProfile: profile
        })
      }
    })
  }
  componentDidMount() {
    DB.subscribeToUpdates(this.getValues)
  }
  componentWillUnmount() {
    DB.unsubscribeFromUpdates()
  }

  getValues(snapshot) {
    let objList = snapshot.val(), newList
    newList = Object.keys(objList).map(key => {
      return Object.assign(
        {},
        objList[key],
        {
          id: key
        }
      )
    });
    this.setState({list: newList})
  }

  addPeople() {
    let newList = [].concat(this.state.list)
    let obj = {
      name: this.refs.nameInput.value,
      age: Math.floor(Math.random() * 100 + 1)
    }
    newList.push(obj);
    this.setState({
      list: newList
    }, () => {
      DB.addItem(obj)
    })
  }

  deleteItem(item) {
    DB.deleteItem(item)
    let newList = this.state.list.filter(listItem => listItem.id !== item.id)
    this.setState({
      list: newList
    })
  }

  addMeal(item, details) {
    const {quantity, unit, type} = details
    let newItem
    if (unit === Units.GRAMS) {
      const percent = parseInt(quantity) / 100
      newItem = Object.assign(
        {},
        item,
        {
          quantity: quantity + ' ' + unit,
          water: item.water * percent,
          calories: item.calories * percent,
          protein: item.protein * percent,
          fat: item.fat * percent,
          carbs: item.carbs * percent,
          sugars: item.sugars * percent,
          fiber: item.fiber * percent
        }
      )
    }
    DB.addMeal(newItem, type)
  }

  auth() {
    DB.authPromise().then(data => {
    }).catch(err => {
      console.log(err)
    });
  }

  logout() {
    DB.logout().then(we => {
      this.setState({
        userProfile: null
      });
    });
  }

  searchFood() {
    foods.searchFood(this.refs.foodInput.value)
      .then(response => {
        let items = response.list.item.map(item => {
          return {
            name: item.name,
            dbno: item.ndbno
          }
        });
        this.setState({
          searchedItems: items
        });
      });
  }

  getDetails(dbno) {
    foods.getDetails(dbno)
      .then(response => {
        let food = response.report.food
        let nutrients = food.nutrients
        let selectedItem = {
          name: food.name,
          water: nutrients[Nutrients.WATER].value,
          calories: nutrients[Nutrients.CALORIES].value,
          protein: nutrients[Nutrients.PROTEIN].value,
          fat: nutrients[Nutrients.FAT].value,
          carbs: nutrients[Nutrients.CARBS].value,
          sugars: nutrients[Nutrients.SUGARS].value,
          fiber: nutrients[Nutrients.FIBER].value
        }
        this.setState({
          detailedFood: selectedItem
        })
      })
  }

  render() {
    let foodItems = this.state.searchedItems.map((item, index) => {
      return (
        <FoodItem item={item} key={index}
                  getDetails={this.getDetails}/>
      );
    });

    return (
      <MuiThemeProvider>
        <Authenticate profile={this.state.userProfile}
                      authenticate={this.auth}
                      logout={this.logout}/>
      </MuiThemeProvider>
    );
  }
}

export default App;
