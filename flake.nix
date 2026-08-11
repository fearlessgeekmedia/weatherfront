{
  description = "IsoBoard - A terminal-based weather application powered by the National Weather Service API";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        isoboard = pkgs.stdenv.mkDerivation rec {
          pname = "isoboard";
          version = "1.0.3";

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
            cp isoboard $out/bin/
            chmod +x $out/bin/isoboard

            # Wrap the script to ensure dependencies are in PATH
            wrapProgram $out/bin/isoboard \
              --prefix PATH : ${pkgs.lib.makeBinPath buildInputs}

            runHook postInstall
          '';

          meta = with pkgs.lib; {
            description = "A terminal-based weather application powered by the National Weather Service API";
            longDescription = ''
              IsoBoard is a user-friendly, terminal-based weather application that provides
              current conditions, detailed forecasts, and animated radar imagery, all powered
              by the National Weather Service (NWS) API. It features automatic location detection,
              animated radar loops, and support for various terminal image protocols including
              Kitty and SIXEL.
              
              Version 1.0.3 includes improvements to temperature accuracy and data selection
              from the NWS API for more reliable current conditions.
            '';
            homepage = "https://github.com/fearlessgeek/isoboard";
            license = licenses.mit;
            maintainers = [ ];
            platforms = platforms.unix;
            mainProgram = "isoboard";
          };
        };
      in
      {
        packages = {
          default = isoboard;
          isoboard = isoboard;
        };

        apps = {
          default = flake-utils.lib.mkApp {
            drv = isoboard;
          };
          isoboard = flake-utils.lib.mkApp {
            drv = isoboard;
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
            echo "IsoBoard development environment"
            echo "Dependencies available: bash, curl, jq, gum, chafa, bc"
            echo "Run './isoboard' to test the application"
          '';
        };
      }
    );
}
