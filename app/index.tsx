import React from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
  Linking,
} from "react-native";

import { router } from "expo-router";


export default function Home() {

  const { width } = useWindowDimensions();

  const isMobile = width < 800;


  return (

    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >


      {/* ================================= */}
      {/* NAVBAR                            */}
      {/* ================================= */}

      <View style={styles.navbar}>


        {/* AmarCure Logo / Slogan */}

        <View style={styles.logoArea}>

          <Text style={styles.logo}>
            AmarCure
          </Text>

          <Text style={styles.slogan}>
            Your Health, Connected.
          </Text>

        </View>



        {/* Navigation */}

        {!isMobile && (

          <View style={styles.navLinks}>

            <TouchableOpacity>
              <Text style={styles.navText}>
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.navText}>
                About
              </Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.navText}>
                Contact
              </Text>
            </TouchableOpacity>

          </View>

        )}



        {/* Login */}

        <TouchableOpacity
          style={styles.topLogin}
          onPress={() => router.push("/login")}
        >

          <Text style={styles.topLoginText}>
            Login
          </Text>

        </TouchableOpacity>

      </View>



      {/* ================================= */}
      {/* HERO SECTION                      */}
      {/* ================================= */}

      <View
        style={[
          styles.hero,
          isMobile && styles.heroMobile,
        ]}
      >


        {/* LEFT SIDE */}

        <View
          style={[
            styles.leftSide,
            isMobile && styles.fullWidth,
          ]}
        >

          <Text style={styles.heroTitle}>

            Your Health,
            {"\n"}

            <Text style={styles.highlight}>
              Connected.
            </Text>

          </Text>


          <Text style={styles.heroText}>

            A simple and secure place to manage your
            important healthcare information.

          </Text>



          {/* Login + Register */}

          <View style={styles.buttons}>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push("/register")}
            >

              <Text style={styles.registerText}>
                Create Account
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/login")}
            >

              <Text style={styles.loginText}>
                Login
              </Text>

            </TouchableOpacity>

          </View>

        </View>



        {/* ================================= */}
        {/* RIGHT SIDE DOCTOR PHOTO           */}
        {/* ================================= */}

        <View
          style={[
            styles.rightSide,
            isMobile && styles.rightMobile,
          ]}
        >

          <View style={styles.mainCircle}>

           <Image
  source={require("../assets/images/doctor-records.jpg")}
  style={styles.doctorImage}
  resizeMode="cover"
/>
          </View>


          {/* Small Brand Label */}

          <View style={styles.photoLabel}>

            <Text style={styles.photoLabelTitle}>
              AmarCure
            </Text>

            <Text style={styles.photoLabelText}>
              Your Health, Connected.
            </Text>

          </View>

        </View>

      </View>



      {/* ================================= */}
      {/* ABOUT SECTION                      */}
      {/* ================================= */}

      <View style={styles.aboutSection}>

        <View
          style={[
            styles.aboutContent,
            isMobile && styles.aboutMobile,
          ]}
        >


          <View style={styles.aboutTitleArea}>

            <Text style={styles.smallHeading}>
              ABOUT US
            </Text>

            <Text style={styles.aboutTitle}>
              Healthcare made
              {"\n"}
              easier with AmarCure.
            </Text>

          </View>



          <View style={styles.aboutTextArea}>

            <Text style={styles.aboutText}>

              AmarCure is designed to bring essential healthcare
              services and medical information together in one
              convenient platform.

            </Text>


            <Text style={styles.aboutTextSecond}>

              Our goal is simple — make healthcare information
              easier to manage, access and use whenever you need it.

            </Text>

          </View>

        </View>

      </View>



      {/* ================================= */}
      {/* CONTACT SECTION                    */}
      {/* ================================= */}

      <View style={styles.contactSection}>


        <View style={styles.contactHeader}>

          <Text style={styles.contactLogo}>
            AmarCure
          </Text>

          <Text style={styles.contactSlogan}>
            Your Health, Connected.
          </Text>

        </View>



        <View
          style={[
            styles.contactItems,
            isMobile && styles.contactItemsMobile,
          ]}
        >


          {/* Phone */}

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => Linking.openURL("tel:01762099987")}
          >

            <Text style={styles.contactIcon}>
              ☎
            </Text>

            <View>

              <Text style={styles.contactLabel}>
                Phone
              </Text>

              <Text style={styles.contactValue}>
                01762099987
              </Text>

            </View>

          </TouchableOpacity>



          {/* Email */}

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() =>
              Linking.openURL("mailto:contact@amarcure.com")
            }
          >

            <Text style={styles.contactIcon}>
              ✉
            </Text>

            <View>

              <Text style={styles.contactLabel}>
                Email
              </Text>

              <Text style={styles.contactValue}>
                contact@amarcure.com
              </Text>

            </View>

          </TouchableOpacity>



          {/* Location */}

          <View style={styles.contactItem}>

            <Text style={styles.contactIcon}>
              ⌖
            </Text>

            <View>

              <Text style={styles.contactLabel}>
                Location
              </Text>

              <Text style={styles.contactValue}>
                NSU, Dhaka, Bangladesh
              </Text>

            </View>

          </View>

        </View>



        {/* Bottom line */}

        <View style={styles.footerLine} />


        <Text style={styles.copyright}>
          © 2026 AmarCure. All rights reserved.
        </Text>

      </View>


    </ScrollView>

  );
}



/* ================================= */
/* STYLES                            */
/* ================================= */

const styles = StyleSheet.create({


  /* ================================= */
  /* PAGE                              */
  /* ================================= */

  page: {

    flex: 1,

    backgroundColor: "#F1F8FA",

  },


  pageContent: {

    minHeight: "100%",

  },



  /* ================================= */
  /* NAVBAR                            */
  /* ================================= */

  navbar: {

    width: "100%",

    maxWidth: 1200,

    alignSelf: "center",

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    paddingHorizontal: 30,

    paddingVertical: 24,

  },


  logoArea: {

    flexDirection: "column",

  },


  logo: {

    fontSize: 24,

    fontWeight: "900",

    color: "#17252A",

  },


  slogan: {

    fontSize: 10,

    color: "#5F7A82",

    marginTop: 2,

  },


  navLinks: {

    flexDirection: "row",

    gap: 35,

  },


  navText: {

    color: "#3B4A50",

    fontSize: 14,

    fontWeight: "600",

  },


  topLogin: {

    backgroundColor: "#3BB9D5",

    paddingVertical: 11,

    paddingHorizontal: 25,

    borderRadius: 22,

  },


  topLoginText: {

    color: "#FFFFFF",

    fontWeight: "700",

  },



  /* ================================= */
  /* HERO                              */
  /* ================================= */

  hero: {

    width: "100%",

    maxWidth: 1200,

    alignSelf: "center",

    flexDirection: "row",

    alignItems: "center",

    minHeight: 560,

    paddingHorizontal: 30,

    paddingVertical: 45,

  },


  heroMobile: {

    flexDirection: "column",

  },


  leftSide: {

    width: "52%",

  },


  fullWidth: {

    width: "100%",

  },


  heroTitle: {

    fontSize: 58,

    lineHeight: 66,

    fontWeight: "900",

    color: "#111827",

  },


  highlight: {

    color: "#35B8D5",

  },


  heroText: {

    marginTop: 20,

    maxWidth: 470,

    color: "#596A70",

    fontSize: 17,

    lineHeight: 26,

  },



  /* ================================= */
  /* BUTTONS                           */
  /* ================================= */

  buttons: {

    flexDirection: "row",

    marginTop: 32,

  },


  registerButton: {

    backgroundColor: "#111111",

    paddingVertical: 15,

    paddingHorizontal: 28,

    borderRadius: 10,

    marginRight: 12,

  },


  registerText: {

    color: "#FFFFFF",

    fontWeight: "700",

    fontSize: 14,

  },


  loginButton: {

    backgroundColor: "#3BB9D5",

    paddingVertical: 15,

    paddingHorizontal: 32,

    borderRadius: 10,

  },


  loginText: {

    color: "#FFFFFF",

    fontWeight: "700",

    fontSize: 14,

  },



  /* ================================= */
  /* RIGHT SIDE PHOTO                  */
  /* ================================= */

  rightSide: {

    width: "48%",

    justifyContent: "center",

    alignItems: "center",

    position: "relative",

  },


  rightMobile: {

    width: "100%",

    marginTop: 55,

  },


  mainCircle: {

    width: 370,

    height: 370,

    borderRadius: 185,

    backgroundColor: "#A9E3EC",

    overflow: "hidden",

    borderWidth: 14,

    borderColor: "#B9EBF2",

  },


  doctorImage: {

    width: "100%",

    height: "100%",

  },


  photoLabel: {

    position: "absolute",

    bottom: 15,

    right: 35,

    backgroundColor: "#FFFFFF",

    paddingVertical: 14,

    paddingHorizontal: 20,

    borderRadius: 12,

    shadowColor: "#000",

    shadowOpacity: 0.12,

    shadowRadius: 12,

    shadowOffset: {

      width: 0,

      height: 5,

    },

    elevation: 5,

  },


  photoLabelTitle: {

    fontSize: 15,

    fontWeight: "800",

    color: "#17252A",

  },


  photoLabelText: {

    color: "#718096",

    fontSize: 10,

    marginTop: 3,

  },



  /* ================================= */
  /* ABOUT                             */
  /* ================================= */

  aboutSection: {

    backgroundColor: "#FFFFFF",

    paddingVertical: 75,

    paddingHorizontal: 30,

  },


  aboutContent: {

    width: "100%",

    maxWidth: 1050,

    alignSelf: "center",

    flexDirection: "row",

    justifyContent: "space-between",

  },


  aboutMobile: {

    flexDirection: "column",

  },


  aboutTitleArea: {

    flex: 1,

    paddingRight: 30,

  },


  smallHeading: {

    color: "#35B8D5",

    fontSize: 12,

    fontWeight: "800",

    letterSpacing: 1.4,

    marginBottom: 12,

  },


  aboutTitle: {

    color: "#17252A",

    fontSize: 30,

    fontWeight: "800",

    lineHeight: 39,

  },


  aboutTextArea: {

    flex: 1,

    justifyContent: "center",

  },


  aboutText: {

    color: "#52606D",

    fontSize: 15,

    lineHeight: 24,

  },


  aboutTextSecond: {

    color: "#52606D",

    fontSize: 15,

    lineHeight: 24,

    marginTop: 15,

  },



  /* ================================= */
  /* CONTACT                           */
  /* ================================= */

  contactSection: {

    backgroundColor: "#17333A",

    paddingTop: 55,

    paddingBottom: 25,

    paddingHorizontal: 30,

  },


  contactHeader: {

    alignItems: "center",

    marginBottom: 35,

  },


  contactLogo: {

    color: "#FFFFFF",

    fontSize: 26,

    fontWeight: "900",

  },


  contactSlogan: {

    color: "#8ECBD6",

    fontSize: 12,

    marginTop: 4,

  },


  contactItems: {

    width: "100%",

    maxWidth: 900,

    alignSelf: "center",

    flexDirection: "row",

    justifyContent: "space-between",

  },


  contactItemsMobile: {

    flexDirection: "column",

  },


  contactItem: {

    flexDirection: "row",

    alignItems: "center",

    marginVertical: 12,

    minWidth: 200,

  },


  contactIcon: {

    width: 42,

    height: 42,

    borderRadius: 21,

    backgroundColor: "#35B8D5",

    color: "#FFFFFF",

    textAlign: "center",

    lineHeight: 42,

    fontSize: 19,

    marginRight: 12,

  },


  contactLabel: {

    color: "#8EAAB0",

    fontSize: 10,

    textTransform: "uppercase",

    letterSpacing: 1,

  },


  contactValue: {

    color: "#FFFFFF",

    fontSize: 13,

    fontWeight: "600",

    marginTop: 3,

  },


  footerLine: {

    height: 1,

    backgroundColor: "#36545B",

    width: "100%",

    maxWidth: 1050,

    alignSelf: "center",

    marginTop: 40,

  },


  copyright: {

    color: "#789298",

    fontSize: 10,

    textAlign: "center",

    marginTop: 20,

  },

});
