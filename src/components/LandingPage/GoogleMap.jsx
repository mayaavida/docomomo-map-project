import { useState, useCallback, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { GoogleMapProvider } from "@ubilabs/google-maps-react-hooks";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import SuperClusterAlgorithm from "./superClusterAlgorithm";
import ReactDOMServer from "react-dom/server";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import "./GoogleMap.css";

const GoogleMap = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const sites = useSelector((store) => store.sites);
  const [mapContainer, setMapContainer] = useState(null);
  const [markerCluster, setMarkerCluster] = useState(null);
  const [map, setMap] = useState(null);

  const mapOptions = useMemo(
    () => ({
      zoom: 6,
      mapId: "8eb7cad122f99b95",
    }),
    []
  );

  const onLoad = useCallback(
    (map) => {
      addMarkers(map);
      setMap(map);
    },
    [sites]
  );

  useEffect(() => {
    console.log("markerCLuster", markerCluster);
    console.log("map", map);
    if (map && markerCluster) {
      addMarkers(map);
    }
  }, [sites]);

  const addMarkers = (map) => {
    if (markerCluster) {
      markerCluster.clearMarkers();
    }
    const infoWindow = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();

    const markers = sites
      .filter((site) => site.latitude && site.longitude)
      .map((site) => {
        const marker = new google.maps.Marker({
          position: { lat: site.latitude, lng: site.longitude },
          icon: {
            url: require("../../images/marker-orange-alt.png"),
            scaledSize: { width: 40, height: 40 },
          },
        });

        bounds.extend({ lat: site.latitude, lng: site.longitude });
        map.fitBounds(bounds);

        marker.addListener("click", () => {
          const infoWindowContent = (
            <div className="info-window-container">
              <h5 id="site-name">{site.site_name}</h5>
              <p id="site-address">
                {site.street}, {site.city}, {site.state}, {site.zip}
              </p>
              {site.url_id != null && (
                <img
                  src={`https://drive.google.com/uc?export=view&id=${site.url_id}`}
                  style={{ height: 100, margin: "auto" }}
                  id="site-image"
                ></img>
              )}

              <a href={`../#/details/${site.id}`} id="details-link">
                Read More
              </a>
            </div>
          );

          infoWindow.setPosition({ lat: site.latitude, lng: site.longitude });
          infoWindow.setContent(
            ReactDOMServer.renderToString(infoWindowContent)
          );
          infoWindow.open({ map });
        });

        return marker;
      });

    var getGoogleClusterInlineSvg = function (color) {
      var encoded = window.btoa(
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-100 -100 200 200"><defs><g id="a" transform="rotate(45)"><path d="M0 47A47 47 0 0 0 47 0L62 0A62 62 0 0 1 0 62Z" fill-opacity="0.7"/><path d="M0 67A67 67 0 0 0 67 0L81 0A81 81 0 0 1 0 81Z" fill-opacity="0.5"/><path d="M0 86A86 86 0 0 0 86 0L100 0A100 100 0 0 1 0 100Z" fill-opacity="0.3"/></g></defs><g fill="' +
          color +
          '"><circle r="42"/><use xlink:href="#a"/><g transform="rotate(120)"><use xlink:href="#a"/></g><g transform="rotate(240)"><use xlink:href="#a"/></g></g></svg>'
      );

      return "data:image/svg+xml;base64," + encoded;
    };
    // Used to customize marker clusters if desired
    const renderer = {
      render: function ({ count, position }) {
        return new google.maps.Marker({
          label: {
            text: count.toString(),
            color: "white",
            fontSize: "10px",
            // fontWeight: "bold",
          },
          position,
          icon: {
            url:
              count > 500
                ? getGoogleClusterInlineSvg("#000")
                : getGoogleClusterInlineSvg("orange"),
            scaledSize: { width: 60, height: 60 },
          },
          title: "Zoom in to view resources in this area",
          // adjust zIndex to be above other markers
          zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
        });
      },
    };

    const newMarkerCluster = new MarkerClusterer({
      markers,
      map,
      algorithm: new SuperClusterAlgorithm({ radius: 100 }),
      renderer: renderer,
    });

    setMarkerCluster(newMarkerCluster);
  };

  return sites && sites.length > 0 ? (
    <GoogleMapProvider
      googleMapsAPIKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      options={mapOptions}
      mapContainer={mapContainer}
      onLoad={onLoad}
    >
      <div className="map-container" ref={(node) => setMapContainer(node)} />
    </GoogleMapProvider>
  ) : (
    <div className="map-container"></div>
  );
};

export default GoogleMap;
