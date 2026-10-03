import { getApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig } from "../../dataconnect/generated";
import "./firebase";

export const dataConnect = getDataConnect(getApp(), connectorConfig);
