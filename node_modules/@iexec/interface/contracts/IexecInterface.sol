pragma solidity >0.5.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "./IexecHub.sol";
import "./IexecClerk.sol";


contract IexecInterface
{
	address constant IEXEC_HUB_MAINNET   = 0x1383c16c927c4A853684d1a9c676986f25E22111;
	address constant IEXEC_HUB_ROPSTEN   = 0xDbe30645EA7d216c31D09f8c5736FE74de774e63;
	address constant IEXEC_HUB_RINKEBY   = 0x0000000000000000000000000000000000000000;
	address constant IEXEC_HUB_KOVAN     = 0xb3901d04CF645747b99DBbe8f2eE9cb41A89CeBF;
	address constant IEXEC_HUB_GOERLI    = 0x99d8717A84d1E97422d04d9a2a82694038470753;
	address constant IEXEC_HUB_BELLECOUR = 0xD5125A2d186E5266dA60e958043d32fE6fBA662f;
	address constant IEXEC_HUB_VIVIANI   = 0x4735e4BC6B143099fDF14224a82429aA34ba4d04;

	IexecHubInterface   public iexecHub;
	IexecClerkInterface public iexecClerk;

	constructor(address _iexecHubAddr)
	public
	{
		if      (_isContract(_iexecHubAddr      )) { iexecHub = IexecHubInterface(_iexecHubAddr      ); }
		else if (_isContract(IEXEC_HUB_MAINNET  )) { iexecHub = IexecHubInterface(IEXEC_HUB_MAINNET  ); }
		else if (_isContract(IEXEC_HUB_ROPSTEN  )) { iexecHub = IexecHubInterface(IEXEC_HUB_ROPSTEN  ); }
		else if (_isContract(IEXEC_HUB_RINKEBY  )) { iexecHub = IexecHubInterface(IEXEC_HUB_RINKEBY  ); }
		else if (_isContract(IEXEC_HUB_KOVAN    )) { iexecHub = IexecHubInterface(IEXEC_HUB_KOVAN    ); }
		else if (_isContract(IEXEC_HUB_GOERLI   )) { iexecHub = IexecHubInterface(IEXEC_HUB_GOERLI   ); }
		else if (_isContract(IEXEC_HUB_BELLECOUR)) { iexecHub = IexecHubInterface(IEXEC_HUB_BELLECOUR); }
		else if (_isContract(IEXEC_HUB_VIVIANI  )) { iexecHub = IexecHubInterface(IEXEC_HUB_VIVIANI  ); }
		else                                       { revert("invalid-hub-address");                     }
		iexecClerk = IexecClerkInterface(iexecHub.iexecclerk());
	}

	function _isContract(address _addr)
	internal view returns (bool)
	{
		uint32 size;
		assembly { size := extcodesize(_addr) }
		return size > 0;
	}
}
