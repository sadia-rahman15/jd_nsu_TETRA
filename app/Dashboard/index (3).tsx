import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import {
  ActivityIndicator, Platform, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from "react-native";
import { getAccessToken } from "../../auth-storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
const GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

type Donor = {
  id:number; name:string; bloodGroup:string; phone:string|null;
  location:string; sourceName:string; sourceUrl:string;
};

export default function BloodSearchScreen() {
  const [bloodGroup,setBloodGroup]=useState("O+");
  const [area,setArea]=useState("");
  const [results,setResults]=useState<Donor[]>([]);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");

  const useCurrentLocation = async () => {
    setMessage("");
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      setMessage("Location permission was not granted.");
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    const places = await Location.reverseGeocodeAsync(position.coords);
    const place = places[0];
    const parts = [place?.district, place?.subregion, place?.city, place?.region]
      .filter(Boolean);
    setArea(Array.from(new Set(parts)).join(", "));
  };

  const search = async () => {
    setLoading(true); setMessage(""); setResults([]);
    try {
      const token = await getAccessToken();
      const url = `${API_BASE_URL}/api/blood-donors/search?bloodGroup=${encodeURIComponent(bloodGroup)}&area=${encodeURIComponent(area.trim())}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseText = await response.text();
      let data: any = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `The blood-search API did not return JSON (HTTP ${response.status}). ` +
          `Confirm that the backend is running on ${API_BASE_URL} and restart Expo after changing .env.`
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Search failed.");
      }
      setResults(data.results || []);
      if(!(data.results || []).length) setMessage("No matching donor was found. Try a broader area.");
    } catch(e) {
      setMessage(e instanceof Error ? e.message : "Could not search donors.");
    } finally { setLoading(false); }
  };

  return <View style={styles.container}>
    <View style={styles.hero}>
      <View>
        <Text style={styles.title}>🩸 Search Blood Donors</Text>
        <Text style={styles.subtitle}>Search the imported public donor directory by blood group and area.</Text>
      </View>
    </View>

    <Text style={styles.label}>Blood group</Text>
    <View style={styles.groupWrap}>
      {GROUPS.map(g=><TouchableOpacity key={g} onPress={()=>setBloodGroup(g)}
        style={[styles.groupButton,bloodGroup===g&&styles.groupActive]}>
        <Text style={[styles.groupText,bloodGroup===g&&styles.groupTextActive]}>{g}</Text>
      </TouchableOpacity>)}
    </View>

    <Text style={styles.label}>Area, district or city</Text>
    <View style={styles.locationRow}>
      <TextInput style={styles.input} value={area} onChangeText={setArea}
        placeholder="Example: Mirpur, Dhaka" placeholderTextColor="#94a3b8"/>
      <TouchableOpacity style={styles.locationButton} onPress={useCurrentLocation}>
        <Ionicons name="locate-outline" size={20} color="#fff"/>
      </TouchableOpacity>
    </View>

    <TouchableOpacity style={styles.searchButton} onPress={search} disabled={loading}>
      {loading?<ActivityIndicator color="#fff"/>:<Text style={styles.searchText}>Search Donors</Text>}
    </TouchableOpacity>

    {message?<Text style={styles.message}>{message}</Text>:null}

    <View style={styles.results}>
      {results.map(item=><View key={item.id} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.drop}><Text style={styles.dropText}>{item.bloodGroup}</Text></View>
          <View style={{flex:1}}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.location}>📍 {item.location || "Location not listed"}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          {item.phone?<TouchableOpacity style={styles.call} onPress={()=>Linking.openURL(`tel:${item.phone}`)}>
            <Ionicons name="call-outline" size={18} color="#fff"/><Text style={styles.callText}>{item.phone}</Text>
          </TouchableOpacity>:<Text style={styles.noPhone}>No valid phone number</Text>}
          <TouchableOpacity style={styles.source} onPress={()=>Linking.openURL(item.sourceUrl)}>
            <Text style={styles.sourceText}>Source</Text>
          </TouchableOpacity>
        </View>
      </View>)}
    </View>

    <Text style={styles.notice}>
      Publicly supplied data may be outdated. Confirm availability politely before travelling. Source credit is preserved.
    </Text>
  </View>;
}

const styles=StyleSheet.create({
 container:{width:"100%",maxWidth:1000,alignSelf:"center"},
 hero:{padding:22,borderRadius:18,backgroundColor:"#7f1d1d",marginBottom:22},
 title:{fontSize:27,fontWeight:"800",color:"#fff"},
 subtitle:{marginTop:7,color:"#fee2e2",lineHeight:21},
 label:{fontWeight:"800",color:"#0f172a",marginBottom:9,marginTop:8},
 groupWrap:{flexDirection:"row",flexWrap:"wrap",gap:9,marginBottom:18},
 groupButton:{minWidth:58,paddingVertical:11,paddingHorizontal:15,borderRadius:12,borderWidth:1,borderColor:"#fecaca",backgroundColor:"#fff"},
 groupActive:{backgroundColor:"#dc2626",borderColor:"#dc2626"},
 groupText:{textAlign:"center",fontWeight:"800",color:"#991b1b"},
 groupTextActive:{color:"#fff"},
 locationRow:{flexDirection:"row",gap:10},
 input:{flex:1,height:52,borderWidth:1,borderColor:"#cbd5e1",borderRadius:12,paddingHorizontal:15,backgroundColor:"#fff",color:"#0f172a"},
 locationButton:{width:52,height:52,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:"#2563eb"},
 searchButton:{height:53,marginTop:14,borderRadius:12,backgroundColor:"#dc2626",alignItems:"center",justifyContent:"center"},
 searchText:{color:"#fff",fontWeight:"800",fontSize:16},
 message:{marginTop:16,padding:13,borderRadius:10,backgroundColor:"#fff7ed",color:"#9a3412"},
 results:{gap:13,marginTop:20},
 card:{padding:17,borderRadius:16,backgroundColor:"#fff",borderWidth:1,borderColor:"#fee2e2"},
 cardTop:{flexDirection:"row",gap:13,alignItems:"center"},
 drop:{width:58,height:58,borderRadius:29,backgroundColor:"#fee2e2",alignItems:"center",justifyContent:"center"},
 dropText:{fontWeight:"900",color:"#b91c1c",fontSize:18},
 name:{fontSize:18,fontWeight:"800",color:"#0f172a"},
 location:{marginTop:5,color:"#64748b"},
 actions:{marginTop:14,flexDirection:"row",gap:10,alignItems:"center",flexWrap:"wrap"},
 call:{flexDirection:"row",gap:8,alignItems:"center",paddingVertical:10,paddingHorizontal:14,borderRadius:10,backgroundColor:"#16a34a"},
 callText:{color:"#fff",fontWeight:"800"},
 source:{paddingVertical:10,paddingHorizontal:15,borderRadius:10,borderWidth:1,borderColor:"#94a3b8"},
 sourceText:{fontWeight:"700",color:"#334155"},
 noPhone:{color:"#b45309"},
 notice:{marginTop:22,color:"#64748b",fontSize:12,lineHeight:18}
});