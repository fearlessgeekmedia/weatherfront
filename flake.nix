{
  description = "WeatherFront - A terminal-based weather application powered by the National Weather Service API";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        weatherfront = pkgs.stdenv.mkDerivation rec {
          pname = "weatherfront";
          version = "1.0.0";

          src = ./.;

          nativeBuildInputs = with pkgs; [
            makeWrapper
          ];

          buildInputs = with pkgs; [
            bash
            curl
            jq
            gum
            chafa
            bc
          ];

          installPhase = ''
            runHook preInstall

            mkdir -p $out/bin
            cp weatherfront $out/bin/
            chmod +x $out/bin/weatherfront

            # Wrap the script to ensure dependencies are in PATH
            wrapProgram $out/bin/weatherfront \
              --prefix PATH : ${pkgs.lib.makeBinPath buildInputs}

            runHook postInstall
          '';

          meta = with pkgs.lib; {
            description = "A terminal-based weather application powered by the National Weather Service API";
            longDescription = ''
              WeatherFront is a user-friendly, terminal-based weather application that provides
              current conditions, detailed forecasts, and animated radar imagery, all powered
              by the National Weather Service (NWS) API. It features automatic location detection,
              animated radar loops, and support for various terminal image protocols including
              Kitty and SIXEL.
            '';
            homepage = "https://github.com/fearlessgeek/weatherfront";
            license = licenses.mit;
            maintainers = [ ];
            platforms = platforms.unix;
            mainProgram = "weatherfront";
          };
        };
      in
      {
        packages = {
          default = weatherfront;
          weatherfront = weatherfront;
        };

        apps = {
          default = flake-utils.lib.mkApp {
            drv = weatherfront;
          };
          weatherfront = flake-utils.lib.mkApp {
            drv = weatherfront;
          };
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bash
            curl
            jq
            gum
            chafa
            bc
          ];

          shellHook = ''
            echo "WeatherFront development environment"
            echo "Dependencies available: bash, curl, jq, gum, chafa, bc"
            echo "Run './weatherfront' to test the application"
          '';
        };
      }
    );
}
