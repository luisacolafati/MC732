import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import {requestForegroundPermissionsAsync, getCurrentPositionAsync, LocationObject, watchHeadingAsync, watchPositionAsync, LocationAccuracy} from 'expo-location'
import { InstitutesService } from '../../services/firestore/InstitutesService';
import { Institute } from '../../types/Institute';
import { styles, mapstyle } from './styles/styles'
import { Bathroom } from '../../types/Bathroom';
import { DrinkingFountain } from '../../types/DrinkingFountain';
import { BathroomService } from '../../services/firestore/BathroomService';
import { DrinkingFountainService } from '../../services/firestore/DrinkingFountainService';
import _ from 'lodash'

export function MapScreen() {

  const initialRegion = {
    latitude: -22.8135,
    longitude: -47.0635,
    latitudeDelta: 0.001,
    longitudeDelta: 0.001,
  };

  const [location, setLocation] = useState<LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState(initialRegion);
  
  const [institutes, setInstitutes] = useState<Institute[]>([])

  const [bathrooms, setBathrooms] = useState<Bathroom[]>([])
  const [bathroomsGroupedByInstitute, setBathroomsGroupedByInstitute] = useState({})
  
  const [drinkingFountains, setDrinkingFountains] = useState<DrinkingFountain[]>([])
  const [drinkingFountainsGroupedByInstitute, setDrinkingFountainsGroupedByInstitute] = useState({})  

  async function requestLocation() {
    const {granted} = await requestForegroundPermissionsAsync();

    if (granted) {
      const posicao = await getCurrentPositionAsync();
      setLocation(posicao);
      setMapRegion({
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001
        })
    }
  }

  // Pede a localizaçao
  useEffect(() => {
    requestLocation();
  }, []);

  // Observa a posicao do dispositivo
  useEffect(() => {
    watchPositionAsync({
      accuracy: LocationAccuracy.Highest,
      timeInterval: 1000,
      distanceInterval: 1
    }, (response : any) => {
      setLocation(response);
    });
  }, [])

  useEffect(() =>  {
    const getInstitutes = async () => {
      try {
        if (institutes.length === 0) {
          const instituteService = InstitutesService.getInstance()
          const institutes = await instituteService.getAllDocuments()
          setInstitutes(institutes)
        }
      } catch (err) {
        console.log(err)
      }
    }

    const getBathrooms = async () => {
      try {
        if (bathrooms.length === 0) {
          const bathroomService = BathroomService.getInstance()
          const bathrooms = await bathroomService.getAllDocuments()
          setBathrooms(bathrooms)
          setBathroomsGroupedByInstitute(_.groupBy(bathrooms, (bathroom: Bathroom) => bathroom.data.instituteLocation))
        }
      } catch (err) {
        console.log(err)
      }
    }

    const getDrinkingFountains = async () => {
      try {
        if (drinkingFountains.length === 0) {
          const drinkingFountainService = DrinkingFountainService.getInstance()
          const drinkingFountains = await drinkingFountainService.getAllDocuments()
          setDrinkingFountains(drinkingFountains)
          setDrinkingFountainsGroupedByInstitute(_.groupBy(drinkingFountains, (drinkingFountain: Bathroom) => drinkingFountain.data.instituteLocation))
        }
      } catch (err) {
        console.log(err)
      }
    }

    getInstitutes()
    getBathrooms()
    getDrinkingFountains()
  }, [])
  
  return (
    <SafeAreaView style={styles.container}>
      <MapView
      style={styles.map}
      customMapStyle={mapstyle}
      initialRegion={ initialRegion}
      region = {mapRegion}
      >
        <Marker
        coordinate={{
        latitude: location?.coords.latitude || 0,
        longitude: location?.coords.longitude || 0
        }}
        pinColor={'green'}
        />

        {institutes.map((institute) => (
            <Marker
              key={institute.id}
              coordinate={{
                latitude: institute.data.location.latitude,
                longitude: institute.data.location.longitude,
              }}
            >
              <Callout>
                <View>
                  <Text>{institute.data.name}</Text>
                  <Text>Banheiros: {(bathroomsGroupedByInstitute as any)[institute.data.name]?.length ?? 'Dado indisponível no momento'}</Text>  
                  <Text>Bebedouros: {(drinkingFountainsGroupedByInstitute as any)[institute.data.name]?.length ?? 'Dado indisponível no momento'}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        
      </MapView>
    </SafeAreaView>
  );
}
