import React from "react";
import HomeHero from "../components/HomeHero";
import HomeCategories from "../components/HomeCategories";
import BusinessDiamondsSection from "../components/BusinessDiamondsSection";
import CraftingSection from "../components/CraftingSection";

const Home = () => {
  return (
    <>
      <HomeHero />
      <BusinessDiamondsSection />
      <HomeCategories />
      <CraftingSection />
    </>
  );
};

export default Home;
