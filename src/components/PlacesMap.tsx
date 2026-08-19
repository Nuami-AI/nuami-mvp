"use client";

import KakaoMap from "@/components/KakaoMap";
import GoogleMapEmbed from "@/components/GoogleMapEmbed";
import { detectDestinationCountry, usesKakaoMap } from "@/lib/geo/destination-country";
import { isMappableQuery, resolveGoogleMapQuery, resolveMapSearchQuery } from "@/lib/kakao/query-builder";
import type { ResultVenue } from "@/lib/results/venue-context";
import type { Place } from "@/types/extraction";

interface Props {
  situation: string;
  venue: ResultVenue;
  mapQuery: string;
  destinationCountry?: string | null;
  places?: Place[];
  whereTo?: string[];
  className?: string;
}

export default function PlacesMap({
  situation,
  venue,
  mapQuery,
  destinationCountry,
  places = [],
  whereTo = [],
  className = "",
}: Props) {
  const country = detectDestinationCountry(situation, destinationCountry);
  const useKakao = usesKakaoMap(country);

  const mappableWhere = whereTo.filter(isMappableQuery);
  const kakaoSearch = resolveMapSearchQuery({
    situation,
    venue,
    places,
    whereTo: mappableWhere,
    explicitQuery: isMappableQuery(mapQuery) ? mapQuery : "",
  });
  const googleSearch = resolveGoogleMapQuery(situation, country);

  if (useKakao) {
    return (
      <KakaoMap
        query={kakaoSearch.primary || (isMappableQuery(mapQuery) ? mapQuery : "")}
        situation={situation}
        venue={venue}
        additionalQueries={[
          ...places.map((p) => p.nameKo ?? p.name).filter(isMappableQuery),
          ...mappableWhere,
        ]}
        className={className}
      />
    );
  }

  return (
    <GoogleMapEmbed
      query={googleSearch.primary}
      country={country}
      className={className}
    />
  );
}
