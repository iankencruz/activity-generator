import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import PocketBase from "pocketbase";

const pb = new PocketBase("http://127.0.0.1:8090");

export const load: PageLoad = async () => {
  try {
    // Fetch the initial list from 'Activity'
    const resultList = await pb.collection("Activity").getList(1, 50);

    // Return it as a property
    return {
      initialActivity: resultList.items,
    };
  } catch (e) {
    console.error(e);
    return { initialActivity: [] };
  }
};
